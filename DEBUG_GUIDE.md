# 🎬 ClipsForge - Guia de Debug

## 🚀 Como usar os scripts de debug

### 1. **Setup Inicial (já executado)**
```bash
./scripts/setup-debug.sh
```

### 2. **Corrigir Problemas Conhecidos**
```bash
./scripts/fix-functions.sh
```

### 3. **Testar Funções Individualmente**
```bash
./scripts/test-functions.sh
```

### 4. **Testar Fluxo Completo**
```bash
./scripts/debug-flow.sh
```

## 📁 Arquivos Criados

- `.env.debug` - Configurações de debug
- `test-video.mp4` - Arquivo de teste
- `DEBUG_GUIDE.md` - Este guia
- `debug-report-*.md` - Relatórios de debug

## 🔧 Configuração

Edite `.env.debug` com suas credenciais reais do Supabase:

```bash
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-anon-key"
SUPABASE_SERVICE_KEY="sua-service-key"
```

## 🐛 Debugging Passo a Passo

### 1. Verificar Edge Functions
```bash
# Listar funções
supabase functions list

# Ver logs
supabase functions logs

# Deploy função específica
supabase functions deploy generate-clips
```

### 2. Testar Função Específica
```bash
# Menu interativo
./scripts/test-functions.sh

# Ou testar diretamente
curl -X POST "https://seu-projeto.supabase.co/functions/v1/generate-clips" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua-service-key" \
  -d '{"video_id": "test-id"}'
```

### 3. Monitorar Banco de Dados
```bash
# Conectar ao banco
supabase db reset

# Ver tabelas
supabase db diff

# Executar query
supabase db shell
```

## 🔍 Problemas Comuns

### Função não encontrada
- Verifique se a função foi deployada
- Confirme o nome da função
- Verifique logs do Supabase

### Erro de autenticação
- Confirme as keys no `.env.debug`
- Verifique RLS policies
- Teste com service key

### Clips não são gerados
- Verifique se o vídeo foi transcrito
- Confirme se a IA está respondendo
- Verifique logs da função generate-clips

## 📊 Monitoramento

### Ver logs em tempo real
```bash
supabase functions logs --follow
```

### Verificar banco
```bash
# Ver vídeos
supabase db shell -c "SELECT * FROM videos LIMIT 5;"

# Ver clips
supabase db shell -c "SELECT * FROM clips LIMIT 5;"

# Ver análises
supabase db shell -c "SELECT * FROM content_analysis LIMIT 5;"
```

## 🆘 Ajuda

Se encontrar problemas:

1. Execute `./scripts/fix-functions.sh` primeiro
2. Verifique os logs: `supabase functions logs`
3. Teste uma função por vez
4. Verifique as credenciais no `.env.debug`
5. Confirme se o Supabase local está rodando

---

**🎬 Happy debugging! 🐛✨**
