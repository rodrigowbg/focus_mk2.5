# Projeto Ford Focus Hatch Titanium 2.0 Manual 2013 — Edição Única

Aplicação web modular com banco de dados offline (`IndexedDB`) e visualização flutuante (`mouseover`) das imagens de cada equipamento.

## Estrutura de Pastas no GitHub

```text
/ (raiz do repositório)
├── index.html
├── manifest.json
├── sw.js
├── README.md
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── equipamentos.json
└── images/
    ├── item-01-velas-ngk-iridium.jpg
    ├── item-02-coxins-motor.jpg
    └── ... (até item-50-ppf-vitrificacao.jpg)
```

## Como Adicionar ou Trocar as Imagens dos Equipamentos
1. Salve a foto desejada dentro da pasta `images/` com o nome exato indicado em `data/equipamentos.json` (ou passe o mouse sobre qualquer linha da tabela na página para ver o nome exato do arquivo esperado).
2. Ao pousar o mouse sobre o nome de qualquer um dos 50 equipamentos na lista, a janela de prévia exibirá automaticamente a foto salva em `images/`.
