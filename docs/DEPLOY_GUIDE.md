# 🚀 ClipsForge - Guia de Deploy

## 🔍 Scripts de Verificação

### **Verificar Status Antes do Deploy:**
```bash
npm run deploy:status
```

### **Verificar e Fazer Deploy com Detecção de Erros:**
```bash
npm run deploy:check
```

### **Deploy Manual:**
```bash
npm run deploy
```

## 🚨 Erros Comuns e Soluções

### **1. 📊 Limite de Deploy Atingido**
```
Error: Resource is limited - try again in X minutes 
(more than 100, code: "api-deployments-free-per-day")
```

**Causa:** Vercel Free Plan tem limite de 100 deploys/dia

**Soluções:**
- ⏰ **Aguardar:** Espere o reset (próximas horas)
- 💰 **Upgrade:** Vercel Pro Plan ($20/mês)
- 🔄 **Reduzir deploys:** Teste local antes de fazer push

### **2. 🔨 Erro de Build**
```
Error: Command "npm run build" exited with 1
```

**Soluções:**
- 🧪 **Teste local:** `npm run build`
- 📝 **Verifique logs:** No dashboard do Vercel
- 🔧 **Corrija erros:** TypeScript, ESLint, etc.

### **3. 🔗 Projeto Não Conectado**
```
Error: Project not found
```

**Soluções:**
- 🔗 **Reconectar:** `npx vercel link`
- 🆕 **Novo projeto:** `npx vercel`

### **4. 🔐 Não Logado**
```
Error: Not authenticated
```

**Solução:**
- 🔐 **Login:** `npx vercel login`

## 📊 Limites do Vercel Free Plan

| Recurso | Limite |
|---------|--------|
| **Deploys/dia** | 100 |
| **Bandwidth** | 100 GB/mês |
| **Builds** | 6000 min/mês |
| **Serverless Functions** | 12 invocações/dia |

## 🎯 Workflow Recomendado

### **1. Desenvolvimento:**
```bash
# Teste local
npm run dev

# Verifique build
npm run build

# Teste unitários
npm run test
```

### **2. Deploy:**
```bash
# Verifique status
npm run deploy:status

# Deploy com verificação
npm run deploy:check
```

### **3. Se der erro de limite:**
```bash
# Aguarde e tente novamente
# OU faça upgrade para Pro Plan
```

## 🔧 Scripts Disponíveis

```json
{
  "deploy": "vercel --prod",
  "deploy:preview": "vercel", 
  "deploy:check": "./scripts/deploy-check.sh",
  "deploy:status": "vercel ls && vercel whoami"
}
```

## 💡 Dicas para Evitar Limite

1. **🧪 Teste local** antes de fazer push
2. **📦 Use preview deploys** para testes
3. **🔄 Agrupe mudanças** em menos commits
4. **⏰ Monitore uso** no dashboard Vercel
5. **💰 Considere upgrade** se usar muito

## 🆘 Em Caso de Problemas

1. **Verifique status:** `npm run deploy:status`
2. **Veja logs:** Dashboard do Vercel
3. **Teste local:** `npm run build`
4. **Reconecte se necessário:** `npx vercel link`

---

**Agora você tem detecção automática de erros! 🎉** 