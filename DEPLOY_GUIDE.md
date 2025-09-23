# Guia de Deploy - Sistema de Precificação Delivery

## Pré-requisitos na Hostinger
1. **Node.js 18+** habilitado no painel
2. **SSH/Terminal** acesso habilitado
3. **Domínio/subdomínio** configurado

## Passo a Passo para Deploy

### 1. Baixar o Código
- Clique nos 3 pontos no v0 → "Download ZIP"
- Extraia o arquivo no seu computador

### 2. Upload para Servidor
**Via File Manager (Hostinger):**
- Acesse File Manager no painel
- Vá para `public_html` ou pasta do seu domínio
- Faça upload de todos os arquivos

**Via FTP/SFTP:**
- Use FileZilla ou similar
- Conecte com suas credenciais
- Upload para pasta correta

### 3. Instalar Dependências
**No Terminal SSH da Hostinger:**
\`\`\`bash
cd /home/seuusuario/public_html
npm install
\`\`\`

### 4. Build do Projeto
\`\`\`bash
npm run build
\`\`\`

### 5. Iniciar Aplicação
\`\`\`bash
npm start
\`\`\`

### 6. Configurar como Serviço (Opcional)
**Para manter rodando sempre:**
\`\`\`bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name "delivery-pricing"

# Salvar configuração
pm2 save
pm2 startup
\`\`\`

## Configurações Importantes

### Variáveis de Ambiente
Crie arquivo `.env.local`:
\`\`\`
NODE_ENV=production
PORT=3000
\`\`\`

### Configuração de Domínio
No painel da Hostinger:
- Configure proxy reverso para porta 3000
- Ou use subdomínio apontando para aplicação

## Troubleshooting

### Erro de Porta
- Verifique se porta 3000 está disponível
- Mude PORT no .env.local se necessário

### Erro de Permissões
\`\`\`bash
chmod -R 755 /caminho/para/projeto
\`\`\`

### Logs de Erro
\`\`\`bash
# Ver logs da aplicação
pm2 logs delivery-pricing

# Ver status
pm2 status
\`\`\`

## URLs de Acesso
- **Desenvolvimento**: http://localhost:3000
- **Produção**: http://seudominio.com
