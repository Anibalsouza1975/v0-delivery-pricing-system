# 📁 Como fazer upload para seu servidor

## Passo a passo:

### 1. Criar pasta no servidor
- Acesse seu cPanel ou FTP
- Vá para `public_html/`
- Crie uma pasta chamada `sistema` ou `cartago`

### 2. Upload dos arquivos
Faça upload destes arquivos para a pasta criada:
- `index.html`
- `styles.css`
- `app.js`

### 3. Testar
Acesse: `radarfoot.com/sistema`

## Estrutura final:
\`\`\`
public_html/
├── (arquivos do radarfoot.com)
└── sistema/
    ├── index.html
    ├── styles.css
    └── app.js
\`\`\`

## Próximos passos:
1. Testar o sistema básico
2. Implementar versão completa com Node.js
3. Configurar banco de dados
4. Integrar WhatsApp real
