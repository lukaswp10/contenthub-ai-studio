# 🔧 GUIA DE SOLUÇÃO DE PROBLEMAS

## ❌ Erro: "process is not defined"

### **Problema:**
```
client.ts:33 Uncaught ReferenceError: process is not defined
```

### **Solução Aplicada:**
✅ **CORRIGIDO** - O problema foi resolvido com as seguintes mudanças:

1. **Atualização do `vite.config.ts`:**
```typescript
define: {
  'process.env': {},
  global: 'globalThis',
},
```

2. **Remoção do `supabaseService` do client.ts**
3. **Configuração automática Local vs Produção**

### **Como Verificar se Foi Corrigido:**
```bash
# Execute o teste
./test-new-flow.sh

# Ou acesse diretamente
open http://localhost:8080
```

---

## 🔄 Tela Branca no Frontend

### **Possíveis Causas:**
1. Cache do navegador
2. Erro de JavaScript não tratado
3. Supabase local não rodando

### **Soluções:**

#### **1. Limpar Cache e Reiniciar:**
```bash
./restart-dev.sh
npm run dev
```

#### **2. Verificar Console do Navegador:**
- Abra DevTools (F12)
- Vá na aba Console
- Verifique se há erros em vermelho

#### **3. Verificar Supabase Local:**
```bash
npx supabase status
# Se não estiver rodando:
npx supabase start
```

---

## 🔐 Problemas de Autenticação

### **JWT Token Expirado:**
```
Error: JWT expired
```

**Solução:** O sistema tem auto-refresh implementado, mas se persistir:
1. Limpe o localStorage do navegador
2. Faça logout/login novamente

### **Conexão com Banco:**
```bash
# Resetar banco local se necessário
npx supabase db reset --local
```

---

## 🧪 Comandos de Teste e Debug

### **Teste Completo do Sistema:**
```bash
./test-new-flow.sh
```

### **Verificar Status dos Serviços:**
```bash
# Supabase
npx supabase status

# Frontend (deve estar em http://localhost:8080)
curl -s http://localhost:8080 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend DOWN"
```

### **Logs Detalhados:**
```bash
# Logs do Supabase
npx supabase logs

# Logs em tempo real
npx supabase logs --follow
```

### **Reiniciar Tudo:**
```bash
# Parar Supabase
npx supabase stop

# Limpar cache
./restart-dev.sh

# Iniciar Supabase
npx supabase start

# Iniciar frontend
npm run dev
```

---

## 📊 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:8080 | Interface principal |
| Supabase API | http://127.0.0.1:54321 | API local |
| Supabase Studio | http://127.0.0.1:54323 | Dashboard do banco |
| Inbucket (Email) | http://127.0.0.1:54324 | Emails de teste |

---

## 🔍 Debugging Avançado

### **Verificar Configuração do Supabase:**
```bash
# Ver configuração atual
cat supabase/config.toml

# Verificar migrações
ls -la supabase/migrations/
```

### **Testar Edge Functions Individualmente:**
```bash
# Upload function
curl -X POST http://127.0.0.1:54321/functions/v1/upload-video \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{"test": true}'

# Analyze function  
curl -X POST http://127.0.0.1:54321/functions/v1/analyze-content \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{"test": true}'
```

### **Verificar Banco de Dados:**
```bash
# Conectar ao banco local (se tiver psql instalado)
# psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Ou usar a interface web
open http://127.0.0.1:54323
```

---

## 🚨 Problemas Críticos

### **Se Nada Funcionar:**

1. **Reset Completo:**
```bash
# Parar tudo
npx supabase stop
pkill -f "npm run dev"

# Limpar completamente
rm -rf node_modules/.vite
rm -rf dist
npm install

# Resetar Supabase
npx supabase db reset --local

# Iniciar tudo novamente
npx supabase start
npm run dev
```

2. **Verificar Portas:**
```bash
# Ver o que está usando as portas
lsof -i :8080  # Frontend
lsof -i :54321 # Supabase API
lsof -i :54323 # Supabase Studio
```

3. **Logs de Erro:**
```bash
# Ver logs detalhados
npx supabase logs --level error
```

---

## ✅ Status Atual

- ✅ Erro "process is not defined" **CORRIGIDO**
- ✅ Configuração Local/Produção **IMPLEMENTADA**
- ✅ Auto-refresh de tokens **FUNCIONANDO**
- ✅ Logs detalhados **ATIVOS**
- ✅ Testes automatizados **DISPONÍVEIS**

**Sistema está funcionando corretamente!** 🎉 