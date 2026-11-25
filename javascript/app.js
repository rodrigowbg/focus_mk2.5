const DB_NAME = 'FocusTitanium2013DB';
const DB_VERSION = 1;
const STORE_NAME = 'equipamentos';

let db = null;
let itemsData = [];

function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllFromDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function saveItemToDB(item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function loadData() {
  await initDB();
  const savedItems = await getAllFromDB();

  try {
    const response = await fetch('./json/equipamentos.json');
    const jsonItems = await response.json();
    const savedMap = new Map(savedItems.map(i => [i.id, i]));

    itemsData = jsonItems.map(base => {
      const existing = savedMap.get(base.id);
      return {
        ...base,
        comprado: existing ? Boolean(existing.comprado) : false,
        instalado: existing ? Boolean(existing.instalado) : false,
        observacao: existing && existing.observacao ? existing.observacao : ''
      };
    });

    for (const item of itemsData) {
      await saveItemToDB(item);
    }
  } catch (err) {
    console.warn('Usando dados em cache offline do IndexedDB:', err);
    itemsData = savedItems.sort((a, b) => a.id - b.id);
  }

  renderTable();
  updateKPIs();
}

function formatBRL(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function updateKPIs() {
  const total = itemsData.length;
  const comprados = itemsData.filter(i => i.comprado).length;
  const instalados = itemsData.filter(i => i.instalado).length;
  const custoTotal = itemsData.reduce((acc, i) => acc + Number(i.preco || 0), 0);
  const custoPago = itemsData.filter(i => i.comprado).reduce((acc, i) => acc + Number(i.preco || 0), 0);

  document.getElementById('kpi-total').textContent = `${total} itens`;
  document.getElementById('kpi-comprados').textContent = `${comprados} / ${total}`;
  document.getElementById('kpi-instalados').textContent = `${instalados} / ${total}`;
  document.getElementById('kpi-custo-total').textContent = formatBRL(custoTotal);
  document.getElementById('kpi-custo-pago').textContent = formatBRL(custoPago);
}

function renderTable() {
  const tbody = document.getElementById('equipamentos-tbody');
  const search = document.getElementById('search-input').value.toLowerCase().trim();
  const etapaFilter = document.getElementById('filter-etapa').value;
  const statusFilter = document.getElementById('filter-status').value;

  const filtered = itemsData.filter(item => {
    const matchText =
      item.nome.toLowerCase().includes(search) ||
      item.local.toLowerCase().includes(search) ||
      item.etapa.toLowerCase().includes(search) ||
      (item.observacao && item.observacao.toLowerCase().includes(search));

    const matchEtapa = etapaFilter === 'todas' || item.etapa === etapaFilter;

    let matchStatus = true;
    if (statusFilter === 'pendentes') matchStatus = !item.comprado;
    if (statusFilter === 'comprados') matchStatus = item.comprado;
    if (statusFilter === 'instalados') matchStatus = item.instalado;

    return matchText && matchEtapa && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 24px; color: #94a3b8;">Nenhum equipamento encontrado com os filtros atuais.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = `item-row ${item.instalado ? 'row-done' : ''}`;
    const imgPath = `./images/${item.imagem}`;

    tr.innerHTML = `
      <td><strong>${String(item.id).padStart(2, '0')}</strong></td>
      <td>
        <div class="item-name">${item.nome}</div>
        <span class="item-img-tag">Passe o mouse: images/${item.imagem}</span>
      </td>
      <td><span class="etapa-pill">${item.etapa}</span></td>
      <td>${item.local}</td>
      <td class="price-cell">${formatBRL(item.preco)}</td>
      <td style="text-align:center;">
        <input type="checkbox" class="chk-comprado" ${item.comprado ? 'checked' : ''}>
      </td>
      <td style="text-align:center;">
        <input type="checkbox" class="chk-instalado" ${item.instalado ? 'checked' : ''}>
      </td>
      <td>
        <input type="text" class="note-input" placeholder="Anotar código/loja..." value="${item.observacao || ''}">
      </td>
    `;

    tr.addEventListener('mouseenter', (e) => showPreview(e, item.nome, imgPath, item.imagem));
    tr.addEventListener('mousemove', movePreview);
    tr.addEventListener('mouseleave', hidePreview);

    const chkComprado = tr.querySelector('.chk-comprado');
    chkComprado.addEventListener('change', async (e) => {
      item.comprado = e.target.checked;
      await saveItemToDB(item);
      updateKPIs();
    });

    const chkInstalado = tr.querySelector('.chk-instalado');
    chkInstalado.addEventListener('change', async (e) => {
      item.instalado = e.target.checked;
      if (item.instalado && !item.comprado) {
        item.comprado = true;
        chkComprado.checked = true;
      }
      tr.classList.toggle('row-done', item.instalado);
      await saveItemToDB(item);
      updateKPIs();
    });

    const noteInput = tr.querySelector('.note-input');
    noteInput.addEventListener('change', async (e) => {
      item.observacao = e.target.value;
      await saveItemToDB(item);
    });

    tbody.appendChild(tr);
  });
}

const previewBox = document.getElementById('hover-preview');
const previewTitle = document.getElementById('preview-title');
const previewImg = document.getElementById('preview-img');
const previewFallback = document.getElementById('preview-fallback');

function showPreview(e, nome, imgPath, fileName) {
  previewTitle.textContent = nome;
  previewFallback.classList.add('hidden');
  previewImg.classList.remove('hidden');

  previewImg.onerror = () => {
    previewImg.classList.add('hidden');
    previewFallback.classList.remove('hidden');
    previewFallback.innerHTML = `Salve a imagem na pasta <strong>images/</strong> com o nome:<br><br><code>${fileName}</code>`;
  };

  previewImg.src = imgPath;
  previewBox.classList.remove('hidden');
  movePreview(e);
}

function movePreview(e) {
  const offset = 18;
  let left = e.clientX + offset;
  let top = e.clientY + offset;

  if (left + 315 > window.innerWidth) {
    left = e.clientX - 315;
  }
  if (top + 270 > window.innerHeight) {
    top = e.clientY - 270;
  }

  previewBox.style.left = `${Math.max(10, left)}px`;
  previewBox.style.top = `${Math.max(10, top)}px`;
}

function hidePreview() {
  previewBox.classList.add('hidden');
}

document.getElementById('search-input').addEventListener('input', renderTable);
document.getElementById('filter-etapa').addEventListener('change', renderTable);
document.getElementById('filter-status').addEventListener('change', renderTable);

document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(itemsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup_focus_titanium_2013.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('input-import').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (Array.isArray(imported)) {
        for (const it of imported) {
          await saveItemToDB(it);
        }
        itemsData = imported;
        renderTable();
        updateKPIs();
        alert('Backup restaurado com sucesso no banco de dados offline!');
      }
    } catch (err) {
      alert('Arquivo JSON inválido.');
    }
  };
  reader.readAsText(file);
});

loadData();
