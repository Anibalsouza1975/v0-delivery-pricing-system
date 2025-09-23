#!/bin/bash

# Script de Deploy para Servidor VPS
# Cartago Burger Grill - Sistema de Gestão

echo "🚀 Iniciando deploy do Sistema Cartago..."

# Criar diretório do projeto
mkdir -p /home/radarfoot/cartago-sistema
cd /home/radarfoot/cartago-sistema

# Backup se já existir
if [ -d "node_modules" ]; then
    echo "📦 Fazendo backup da instalação anterior..."
    mv node_modules node_modules_backup_$(date +%Y%m%d_%H%M%S)
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar arquivo de variáveis de ambiente
echo "🔧 Configurando variáveis de ambiente..."
cat > .env.local << EOF
# Groq AI Configuration
GROQ_API_KEY=gsk_qZHvMbJvVGxHCtycdRSWGdyb3FYrKGQ

# WhatsApp Configuration  
WHATSAPP_VERIFY_TOKEN=cartago_webhook_2024
WHATSAPP_ACCESS_TOKEN=temporario
WHATSAPP_PHONE_NUMBER_ID=temporario

# Next.js Configuration
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0
EOF

# Build da aplicação
echo "🏗️ Fazendo build da aplicação..."
npm run build

# Configurar PM2
echo "⚙️ Configurando PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cartago-sistema',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0'
    }
  }]
}
EOF

# Parar processo anterior se existir
pm2 stop cartago-sistema 2>/dev/null || true
pm2 delete cartago-sistema 2>/dev/null || true

# Iniciar aplicação
echo "🚀 Iniciando aplicação..."
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save
pm2 startup

echo "✅ Deploy concluído!"
echo "🌐 Sistema disponível em: http://radarfoot.com:3001"
echo "📊 Monitorar com: pm2 monit"
echo "📝 Logs com: pm2 logs cartago-sistema"
