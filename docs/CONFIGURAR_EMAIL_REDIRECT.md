# 🔧 CONFIGURAR REDIRECIONAMENTO DE EMAIL - SUPABASE

## 🚨 PROBLEMA:
Após confirmação de email, está redirecionando para projeto antigo.

## ✅ SOLUÇÃO:

### 1. **Acesse Supabase Dashboard:**
- https://supabase.com/dashboard
- Projeto: **ClipBursts**

### 2. **Vá para Authentication:**
- Barra lateral → **Authentication**
- Clique em **Settings**

### 3. **Configure Site URL:**
Na seção **Site URL**:
```
https://clipsforge.vercel.app
```

### 4. **Configure Redirect URLs:**
Na seção **Redirect URLs**, adicione:
```
https://clipsforge.vercel.app/login
https://clipsforge.vercel.app/dashboard
https://clipsforge.vercel.app/auth/callback
http://localhost:8081/login (para desenvolvimento)
http://localhost:8081/dashboard
```

### 5. **Email Templates:**
Na seção **Email Templates**:
- Clique em **Confirm signup**
- Verifique se o link contém: `{{ .SiteURL }}/auth/confirm?...`

### 6. **Salvar:**
- Clique **Save** em cada seção alterada

## 🧪 TESTAR:
1. Registre um novo usuário
2. Verifique o email de confirmação
3. O link deve levar para: `https://clipsforge.vercel.app`

## 📋 VALORES EXATOS PARA COPIAR:

**Site URL:**
```
https://clipsforge.vercel.app
```

**Redirect URLs (uma por linha):**
```
https://clipsforge.vercel.app/login
https://clipsforge.vercel.app/dashboard  
https://clipsforge.vercel.app/auth/callback
http://localhost:8081/login
http://localhost:8081/dashboard
``` 