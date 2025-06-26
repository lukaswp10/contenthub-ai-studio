#!/bin/bash
echo "🧹 Limpando processos do Cursor..."
pkill -f cursor 2>/dev/null || echo "Nenhum processo do Cursor"
pkill -f "cursor-server" 2>/dev/null || echo "Nenhum cursor-server"
pkill -f "node.*vite" 2>/dev/null || echo "Nenhum processo Vite órfão"
rm -rf .vite/ 2>/dev/null || echo "Cache já limpo"
echo "✅ Limpeza concluída!"
