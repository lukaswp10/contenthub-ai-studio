#!/bin/bash

echo "🔄 REINICIANDO DESENVOLVIMENTO - CLIPSFORGE"

# Para o servidor de desenvolvimento se estiver rodando
echo "⏹️ Parando processos existentes..."
pkill -f "vite"
pkill -f "supabase"

# Limpa cache e reinstala dependências se necessário
echo "🧹 Limpando cache..."
rm -rf node_modules/.vite
rm -rf .next

# Reinicia Supabase local
echo "🗄️ Reiniciando Supabase local..."
npx supabase stop
npx supabase start

# Aguarda alguns segundos
sleep 3

# Inicia o servidor de desenvolvimento
echo "🚀 Iniciando servidor de desenvolvimento..."
npm run dev

echo "✅ Ambiente ClipsForge reiniciado com sucesso!"
echo "🌐 Frontend: http://localhost:8080"
echo "🗄️ Supabase Studio: http://127.0.0.1:54323" 