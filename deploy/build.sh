#!/bin/bash
# Script para gerar build estático do sistema

echo "🚀 Gerando build estático para deploy..."

# Criar diretório de deploy
mkdir -p deploy/cartago-sistema

# Gerar build Next.js estático
npm run build
npm run export

# Copiar arquivos necessários
cp -r out/* deploy/cartago-sistema/
cp -r public/* deploy/cartago-sistema/

echo "✅ Build gerado em deploy/cartago-sistema/"
echo "📁 Faça upload desta pasta para public_html/sistema/"
