# Dossiê Ford Focus Hatch Titanium 2.0 16V Manual 2013 (Edição Única)

Aplicação web progressiva (PWA) e banco de dados offline (`IndexedDB`) para gestão de compra de peças, etapas de montagem, custos e visualização de imagens dos 50 equipamentos do projeto.

## Estrutura de Pastas
- `index.html` — Página principal do projeto (na raiz)
- `manifest.json` e `sw.js` — Configuração de instalação como aplicativo e cache offline
- `css/style.css` — Estilos visuais escuros com detalhes em azul
- `javascript/app.js` — Banco de dados local `IndexedDB`, backup JSON e prévia flutuante ao passar o mouse
- `json/equipamentos.json` — Catálogo editável com os 50 equipamentos, locais de compra e preços estimados
- `images/` — Pasta para salvar as fotos das peças (ex.: `item-01-velas-bobinas-filtros.jpg`)
