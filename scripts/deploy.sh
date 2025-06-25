#!/bin/bash

# 🚀 ClipsForge - Deploy Script
echo "🚀 Iniciando deploy do ClipsForge..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Install dependencies
echo "📦 Instalando dependências..."
npm install

# Build the project
echo "🔨 Construindo projeto..."
npm run build

# Deploy to Vercel (if vercel is installed)
if command -v vercel &> /dev/null; then
    echo "🌐 Fazendo deploy para Vercel..."
    vercel --prod
else
    echo "⚠️ Vercel CLI não encontrado. Instale com: npm i -g vercel"
fi

echo "✅ Deploy concluído!" 