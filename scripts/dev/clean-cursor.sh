#!/bin/bash

# 🚀 SCRIPT DE OTIMIZAÇÃO DO CURSOR
echo "🧹 Iniciando limpeza e otimização do Cursor..."

# 1. Limpar cache do NPM
echo "📦 Limpando cache do NPM..."
npm cache clean --force

# 2. Limpar node_modules desnecessários
echo "🗂️ Limpando node_modules antigos..."
find . -name "node_modules" -type d -not -path "./node_modules" -exec rm -rf {} + 2>/dev/null || true

# 3. Limpar logs do Cursor
echo "📝 Limpando logs do Cursor..."
find ~/.cursor -name "*.log" -size +5M -delete 2>/dev/null || true
find ~/.config/Code -name "*.log" -size +5M -delete 2>/dev/null || true

# 4. Limpar cache do sistema
echo "💾 Limpando cache do sistema..."
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1 || true

# 5. Otimizar Git
echo "🔧 Otimizando repositório Git..."
git gc --prune=now --aggressive 2>/dev/null || true

# 6. Limpar arquivos temporários
echo "🗑️ Limpando arquivos temporários..."
rm -rf /tmp/vscode-* 2>/dev/null || true
rm -rf ~/.cache/vscode-* 2>/dev/null || true

# 7. Verificar espaço liberado
echo "📊 Verificando espaço em disco..."
df -h . | tail -1

echo "✅ Limpeza concluída! Reinicie o Cursor para melhor performance."

# 8. Sugestões adicionais
echo ""
echo "💡 DICAS ADICIONAIS:"
echo "   • Feche abas desnecessárias no Cursor"
echo "   • Desative extensões não utilizadas"
echo "   • Use Ctrl+Shift+P > 'Reload Window'"
echo "   • Considere reiniciar o Cursor completamente"
