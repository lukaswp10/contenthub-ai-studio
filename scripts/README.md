# 🎬 ClipsForge - Scripts de Debug

Sistema completo de debugging para identificar e corrigir problemas no fluxo de upload até criação de clips.

## 📋 Scripts Disponíveis

### 🚀 **setup-debug.sh** - Configuração Inicial
```bash
./scripts/setup-debug.sh
```
**O que faz:**
- ✅ Verifica dependências (curl, jq, supabase CLI)
- ⚙️ Configura variáveis do Supabase (.env.debug)
- 📝 Atualiza outros scripts com suas credenciais
- 🎥 Cria arquivo de vídeo de teste
- 📚 Gera guia de uso completo
- 🔧 Torna todos os scripts executáveis

**Execute PRIMEIRO!**

### ⚡ **quick-check.sh** - Verificação Rápida
```bash
./scripts/quick-check.sh
```
**O que faz:**
- 📁 Verifica estrutura das funções
- 🔍 Identifica problemas conhecidos
- ✂️ Analisa função generate-clips especificamente
- ⚙️ Verifica configurações
- 🗄️ Checa migrations e tabelas
- 🔧 Lista dependências faltantes
- 📋 Dá recomendações de ações

**Execute para diagnóstico rápido!**

### 🔧 **fix-functions.sh** - Correção Automática
```bash
./scripts/fix-functions.sh
```
**O que faz:**
- 🔍 Corrige typos conhecidos (starso_time → start_time, etc.)
- 📦 Verifica imports e dependências
- 🏗️ Analisa estrutura das funções
- ✂️ Corrige função generate-clips especificamente
- ⚙️ Verifica configuração do Supabase
- 🗄️ Checa migrations
- 📋 Gera relatório detalhado

**Execute após identificar problemas!**

### 🧪 **test-functions.sh** - Teste Individual
```bash
./scripts/test-functions.sh
```
**O que faz:**
- 🎯 Testa cada função edge individualmente
- 📝 Menu interativo para escolher função
- 📦 Mostra payload de teste
- 📡 Faz request e mostra resposta
- ✅ Indica sucesso/falha de cada função
- 🚀 Opção para testar todas de uma vez

**Execute para testar funções específicas!**

### 🔄 **debug-flow.sh** - Fluxo Completo
```bash
./scripts/debug-flow.sh
```
**O que faz:**
- 🔐 Testa autenticação
- 📤 Simula upload de vídeo
- 🎤 Testa transcrição
- 🧠 Testa análise de conteúdo
- ✂️ Testa geração de clips
- 👀 Monitora progresso em tempo real
- 📊 Gera relatório final completo

**Execute para testar o fluxo completo!**

## 🚀 Como Usar - Passo a Passo

### 1. **Setup Inicial**
```bash
# Configurar ambiente
./scripts/setup-debug.sh

# Editar credenciais reais
nano .env.debug
```

### 2. **Verificação Rápida**
```bash
# Ver status geral
./scripts/quick-check.sh
```

### 3. **Corrigir Problemas**
```bash
# Se houver problemas identificados
./scripts/fix-functions.sh
```

### 4. **Testar Individualmente**
```bash
# Menu interativo
./scripts/test-functions.sh

# Ou testar função específica via curl
curl -X POST "https://seu-projeto.supabase.co/functions/v1/generate-clips" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua-service-key" \
  -d '{"video_id": "test-id"}'
```

### 5. **Testar Fluxo Completo**
```bash
# Fluxo end-to-end
./scripts/debug-flow.sh
```

## 📁 Arquivos Gerados

- `.env.debug` - Configurações de debug
- `test-video.mp4` - Arquivo de teste
- `DEBUG_GUIDE.md` - Guia completo de uso
- `debug-report-*.md` - Relatórios de correções
- `*.backup` - Backups dos arquivos corrigidos

## 🔧 Configuração

### Edite `.env.debug` com suas credenciais:
```bash
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-anon-key-aqui"
SUPABASE_SERVICE_KEY="sua-service-key-aqui"
```

### Para encontrar suas credenciais:
1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em Settings → API
4. Copie URL e Keys

## 🐛 Problemas Comuns e Soluções

### ❌ **Função não encontrada**
```bash
# Verificar se função existe
supabase functions list

# Deploy função
supabase functions deploy generate-clips

# Ver logs
supabase functions logs generate-clips
```

### ❌ **Erro de autenticação**
```bash
# Verificar credenciais
cat .env.debug

# Testar com service key
curl -H "Authorization: Bearer sua-service-key" \
     -H "apikey: sua-anon-key" \
     "https://seu-projeto.supabase.co/rest/v1/videos"
```

### ❌ **Clips não são gerados**
```bash
# Verificar se vídeo foi transcrito
supabase db shell -c "SELECT id, title, transcript FROM videos WHERE transcript IS NOT NULL LIMIT 5;"

# Ver logs da função
supabase functions logs generate-clips --follow

# Testar função diretamente
./scripts/test-functions.sh
```

### ❌ **Typos no código**
```bash
# Corrigir automaticamente
./scripts/fix-functions.sh

# Verificar correções
git diff supabase/functions/
```

## 📊 Monitoramento

### Ver logs em tempo real:
```bash
supabase functions logs --follow
```

### Verificar banco de dados:
```bash
# Conectar ao banco
supabase db shell

# Ver tabelas
\dt

# Consultas úteis
SELECT COUNT(*) FROM videos;
SELECT COUNT(*) FROM clips;
SELECT * FROM clips WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Verificar storage:
```bash
# Listar objetos
supabase storage ls videos

# Ver políticas
supabase db shell -c "SELECT * FROM storage.policies;"
```

## 🎯 Fluxo de Debug Recomendado

```bash
# 1. Setup inicial (uma vez)
./scripts/setup-debug.sh

# 2. Verificação rápida
./scripts/quick-check.sh

# 3. Corrigir problemas encontrados
./scripts/fix-functions.sh

# 4. Testar função problemática
./scripts/test-functions.sh

# 5. Testar fluxo completo
./scripts/debug-flow.sh

# 6. Se ainda houver problemas, ver logs
supabase functions logs generate-clips --follow
```

## 🆘 Suporte

Se os scripts não resolverem o problema:

1. **Verifique os logs:** `supabase functions logs`
2. **Teste manualmente:** Use curl direto nas funções
3. **Verifique o banco:** Confirme se dados estão sendo salvos
4. **Redeploye funções:** `supabase functions deploy --all`
5. **Reset do banco:** `supabase db reset` (cuidado!)

## 📚 Documentação Adicional

- `DEBUG_GUIDE.md` - Guia completo gerado pelo setup
- `debug-report-*.md` - Relatórios de correções
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

**🎬 Happy debugging! Encontre e corrija todos os bugs! 🐛✨**