# 🚀 Deploy Completo - Cartago Sistema

## Pré-requisitos Verificados ✅
- Node.js v18.20.8
- npm v10.8.2  
- PM2 v6.0.5

## Passo a Passo do Deploy

### 1. Upload dos Arquivos
\`\`\`bash
# No seu computador, compacte todos os arquivos do projeto
# Faça upload via FTP/SFTP para: /home/radarfoot/cartago-sistema/
\`\`\`

### 2. Conectar via SSH
\`\`\`bash
ssh radarfoot@62.72.63.247
cd /home/radarfoot/cartago-sistema
\`\`\`

### 3. Executar Deploy
\`\`\`bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar deploy
./deploy.sh
\`\`\`

### 4. Configurar Firewall (se necessário)
\`\`\`bash
# Abrir porta 3001
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
\`\`\`

### 5. Configurar Proxy Reverso (Opcional)
Para acessar via radarfoot.com/sistema em vez de :3001

\`\`\`bash
# Editar configuração do Apache/Nginx
# Adicionar proxy para porta 3001
\`\`\`

## URLs de Acesso

- **Sistema Completo**: http://radarfoot.com:3001
- **Versão Estática**: http://radarfoot.com/sistema_cartago

## Comandos Úteis

\`\`\`bash
# Verificar status
pm2 status

# Ver logs
pm2 logs cartago-sistema

# Reiniciar
pm2 restart cartago-sistema

# Parar
pm2 stop cartago-sistema

# Monitorar recursos
pm2 monit
\`\`\`

## Funcionalidades Ativas

✅ **Dashboard Executivo** - Métricas e relatórios  
✅ **Cadastro de Insumos** - Gerenciamento de ingredientes  
✅ **Ficha Técnica** - Receitas e composições  
✅ **Precificação Automática** - Cálculo de preços  
✅ **Auto Atendimento WhatsApp** - IA integrada  
✅ **Sistema de Vendas** - Gestão de pedidos  

## Integração IA (Groq)
- API Key configurada
- Modelos de linguagem ativos
- Respostas automáticas funcionais

## Suporte
- Logs em: `/home/radarfoot/cartago-sistema/.next/`
- PM2 logs: `pm2 logs cartago-sistema`
- Monitoramento: `pm2 monit`
