# 🎯 GUIA VISUAL - CONFIGURAR EMAIL REDIRECT SUPABASE

## 📍 PROBLEMA:
> "não achei para redirecionar o confirmar email"

## 🔍 PASSO A PASSO VISUAL:

### **1. ACESSE O DASHBOARD**
- Vá para: https://supabase.com/dashboard
- Faça login se necessário

### **2. SELECIONE O PROJETO**
- Você verá uma lista de projetos
- Clique no card: **"ClipBursts"**
- (ID: rgwbtdzdeibobuveegfp)

### **3. NAVEGUE PARA AUTHENTICATION**
**Na barra lateral ESQUERDA, procure:**
```
🏠 Home
📊 Table Editor
🗃️ Database
🔐 Authentication  ← CLIQUE AQUI
🛡️ Edge Functions
📦 Storage
⚙️ Settings
```

### **4. DENTRO DE AUTHENTICATION**
**Você verá ABAS no topo:**
```
👥 Users  |  🔐 Policies  |  ⚙️ Settings  ← CLIQUE EM SETTINGS
```

### **5. NA PÁGINA SETTINGS**
**Role a página para baixo e procure estas seções:**

#### **📧 A. Site URL (primeira seção)**
```
Site URL
The base URL of your site
```
**Campo de texto:** 
- Apague o que estiver lá
- Cole: `https://clipsforge.vercel.app`
- Clique **Save**

#### **🔄 B. Redirect URLs (seção abaixo)**
```
Redirect URLs
URLs that auth providers are permitted to redirect to post authentication
```
**Campo de texto grande:**
- Apague tudo que estiver lá
- Cole estas URLs (uma por linha):
```
https://clipsforge.vercel.app/login
https://clipsforge.vercel.app/dashboard
https://clipsforge.vercel.app/auth/callback
http://localhost:8081/login
http://localhost:8081/dashboard
```
- Clique **Save**

### **6. CONFIGURAR EMAIL TEMPLATES**
**Continue rolando para baixo até encontrar:**
```
📧 Email Templates
```

**Clique em:** `Confirm signup` (primeiro da lista)

**Verifique se o conteúdo contém:**
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">
```

**Se não tiver, substitua o link por:**
```html
<a href="{{ .SiteURL }}/login?confirmed=true">Confirmar Email</a>
```

**Clique:** `Save`

## 🔍 SE NÃO ENCONTRAR "SETTINGS":

### **ALTERNATIVA - PROCURE POR:**
- **"Configuration"** ou
- **"Auth Settings"** ou  
- **"Email Settings"**

### **OU NAVEGUE POR:**
```
Authentication → (procure abas) → Settings/Configuration
```

## 📱 DICA VISUAL:

**Você está procurando por campos que parecem assim:**

```
┌─────────────────────────────────────┐
│ Site URL                            │
│ ┌─────────────────────────────────┐ │
│ │ https://your-site.com           │ │
│ └─────────────────────────────────┘ │
│                            [Save]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Redirect URLs                       │
│ ┌─────────────────────────────────┐ │
│ │ https://your-site.com/login     │ │
│ │ https://your-site.com/dashboard │ │
│ └─────────────────────────────────┘ │
│                            [Save]   │
└─────────────────────────────────────┘
```

## 🚨 VALORES QUE VOCÊ DEVE USAR:

**Site URL:**
```
https://clipsforge.vercel.app
```

**Redirect URLs:**
```
https://clipsforge.vercel.app/login
https://clipsforge.vercel.app/dashboard
https://clipsforge.vercel.app/auth/callback
http://localhost:8081/login
http://localhost:8081/dashboard
```

## ✅ CONFIRMAÇÃO:
Após salvar, registre um novo usuário de teste e verifique se o email de confirmação leva para o site correto!

## 🆘 SE AINDA NÃO CONSEGUIR:
Me mande um print da tela do Supabase que você está vendo e eu te ajudo a navegar! 