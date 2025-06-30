# 🌐 CONFIGURAÇÃO VERCEL VIA WEB - PASSO A PASSO

## ✅ SUAS CREDENCIAIS (já obtidas):
- **URL:** https://rgwbtdzdeibobuveegfp.supabase.co
- **CHAVE:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw

---

## 📍 PASSO A PASSO:

### 1. **Acesse o Vercel Dashboard**
- Vá para: https://vercel.com/dashboard
- Faça login se necessário

### 2. **Encontre seu projeto**
- Procure o projeto: **clipsforge**
- Clique no card do projeto

### 3. **Vá para Settings**
- No topo da página do projeto, clique na aba **"Settings"**

### 4. **Acesse Environment Variables**
- Na barra lateral esquerda, clique em **"Environment Variables"**

### 5. **Adicione a primeira variável**
- Clique no botão **"Add New"**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://rgwbtdzdeibobuveegfp.supabase.co`
- **Environments:** Selecione **"Production", "Preview", "Development"** (todas)
- Clique **"Save"**

### 6. **Adicione a segunda variável**
- Clique no botão **"Add New"** novamente
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw`
- **Environments:** Selecione **"Production", "Preview", "Development"** (todas)
- Clique **"Save"**

### 7. **Redeploy o projeto**
- Vá para a aba **"Deployments"**
- Encontre o deployment mais recente
- Clique nos **três pontinhos (...)** ao lado
- Clique **"Redeploy"**
- Confirme clicando **"Redeploy"** novamente

---

## ✅ CHECKLIST:
- [ ] Acessei vercel.com/dashboard
- [ ] Encontrei o projeto clipsforge
- [ ] Adicionei VITE_SUPABASE_URL
- [ ] Adicionei VITE_SUPABASE_ANON_KEY
- [ ] Fiz redeploy
- [ ] Aguardei deploy completar (~2-3 minutos)

---

## 🎯 TESTE:
Após o deploy, acesse: **https://clipsforge.vercel.app**
E teste o registro de usuário!

## 🚨 IMPORTANTE:
- Use sempre a chave **anon public** (não a service_role)
- Selecione TODOS os ambientes (Production, Preview, Development)
- Aguarde o deploy completar antes de testar 