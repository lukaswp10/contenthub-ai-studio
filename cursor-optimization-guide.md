# 🚀 Guia de Otimização do Cursor

## ✅ Configurações Aplicadas

### 1. **Terminal Otimizado** (.vscode/settings.json)
- `scrollback: 1000` - Histórico limitado para performance
- `fastScrollSensitivity: 5` - Scroll mais rápido
- `smoothScrolling: true` - Scroll suave
- `fontSize: 14` - Tamanho otimizado

### 2. **Chat/AI Otimizado**
- `maxTokens: 4000` - Limite de tokens para respostas mais rápidas
- `temperature: 0.3` - Respostas mais precisas e consistentes
- `streaming: true` - Respostas em tempo real
- `enableCodeActions: true` - Ações de código habilitadas

### 3. **Performance Geral**
- `largeFileOptimizations: true` - Otimização para arquivos grandes
- `maxMemoryForLargeFilesMB: 4096` - 4GB para arquivos grandes
- `searchMaxResults: 20000` - Limite de resultados de busca
- `editorLimit: 10` - Máximo 10 abas abertas

## 📋 Boas Práticas para Chat

### ✅ **FAÇA:**
- Use arquivos separados (.sh, .sql, .md)
- Quebre comandos longos em etapas
- Use `echo` ao invés de `cat` com heredoc
- Prefira scripts executáveis
- Mantenha comandos simples e diretos

### ❌ **EVITE:**
- Comandos com muitas linhas consecutivas
- Heredoc muito longos no terminal
- Múltiplas operações em um comando
- Arquivos muito grandes no chat
- Comandos interativos longos

## 🔧 **Comandos Otimizados**

### Ao invés de:
```bash
cat << 'EOF' > arquivo.txt
linha 1
linha 2
...
linha 50
EOF
```

### Use:
```bash
# Criar arquivo separado
echo "Conteúdo" > arquivo.txt
# Ou usar edit_file tool
```

## 🎯 **Para SQL:**
1. Criar arquivos `.sql` separados
2. Executar via Supabase Studio
3. Usar migrations quando possível
4. Evitar SQL inline muito longo

## 📁 **Estrutura Recomendada:**
```
projeto/
├── scripts/          # Scripts bash
├── sql/             # Arquivos SQL
├── docs/            # Documentação
├── .vscode/         # Configurações do editor
└── README.md        # Guia principal
```

## 🚀 **Resultado Esperado:**
- ✅ Chat mais rápido e responsivo
- ✅ Terminal mais eficiente
- ✅ Menos travamentos
- ✅ Melhor experiência de desenvolvimento

---

**Última atualização:** 25/06/2025  
**Status:** ✅ Configurações aplicadas 