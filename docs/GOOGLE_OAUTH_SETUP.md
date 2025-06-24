# 🔐 Configuração Google OAuth - ClipsForge

## 📋 Pré-requisitos

1. Conta Google Cloud Platform
2. Projeto Supabase configurado
3. Domínio configurado (para produção)

## 🚀 Passo a Passo

### 1. **Google Cloud Console**

#### Criar Projeto (se necessário)
```bash
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione existente
3. Nome: "ClipsForge OAuth"
```

#### Configurar OAuth Consent Screen
```bash
1. Navegue para: APIs & Services > OAuth consent screen
2. Escolha: External (para usuários públicos)
3. Preencha:
   - App name: ClipsForge
   - User support email: support@clipsforge.com
   - Developer email: dev@clipsforge.com
   - App domain: https://clipsforge.com
   - Authorized domains: clipsforge.com
```

#### Criar Credenciais OAuth
```bash
1. Navegue para: APIs & Services > Credentials
2. Clique: Create Credentials > OAuth 2.0 Client IDs
3. Application type: Web application
4. Name: ClipsForge Web Client
5. Authorized redirect URIs:
   - https://[SEU_PROJETO_SUPABASE].supabase.co/auth/v1/callback
   - http://127.0.0.1:54321/auth/v1/callback (desenvolvimento)
```

### 2. **Supabase Configuration**

#### No Dashboard Supabase
```bash
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Navegue para: Authentication > Providers
4. Encontre "Google" e clique em configurar
```

#### Configurações Necessárias
```env
# Copie do Google Cloud Console
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui

# URLs de Redirect
Site URL: https://clipsforge.com
Redirect URLs:
- https://clipsforge.com/auth/callback
- http://localhost:8080/auth/callback
```

### 3. **Configuração Local**

#### Arquivo .env.local
```env
# Supabase
VITE_SUPABASE_URL=https://[SEU_PROJETO].supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key

# Google OAuth (opcional para desenvolvimento)
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui
```

#### Supabase Local
```bash
# No arquivo supabase/config.toml
[auth.external.google]
enabled = true
client_id = "seu_client_id_aqui"
secret = "seu_client_secret_aqui"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
```

### 4. **Teste da Configuração**

#### Desenvolvimento Local
```bash
1. npm run dev
2. Acesse: http://localhost:8080/auth/login
3. Clique em "Continuar com Google"
4. Complete o fluxo OAuth
5. Verifique redirecionamento para /onboarding
```

#### Verificar Logs
```bash
# Logs do Supabase
npx supabase logs

# Logs específicos de auth
npx supabase logs --filter="auth"
```

## 🔧 Troubleshooting

### Erro: "redirect_uri_mismatch"
```bash
Solução:
1. Verifique URLs no Google Cloud Console
2. Certifique-se que incluiu todas as URLs:
   - Produção: https://clipsforge.com/auth/callback
   - Desenvolvimento: http://localhost:8080/auth/callback
   - Supabase: https://[projeto].supabase.co/auth/v1/callback
```

### Erro: "invalid_client"
```bash
Solução:
1. Verifique Client ID e Secret no Supabase
2. Certifique-se que copiou corretamente do Google Cloud
3. Verifique se o projeto está ativo no Google Cloud
```

### Erro: "access_denied"
```bash
Solução:
1. Verifique OAuth Consent Screen
2. Adicione domínio autorizado
3. Publique o app (se necessário)
```

## 📱 URLs Importantes

### Desenvolvimento
```
Frontend: http://localhost:8080
Supabase: http://127.0.0.1:54321
Auth Callback: http://localhost:8080/auth/callback
```

### Produção
```
Frontend: https://clipsforge.com
Auth Callback: https://clipsforge.com/auth/callback
Supabase: https://[projeto].supabase.co/auth/v1/callback
```

## ✅ Checklist de Configuração

- [ ] Projeto Google Cloud criado
- [ ] OAuth Consent Screen configurado
- [ ] Credenciais OAuth criadas
- [ ] URLs de redirect configuradas
- [ ] Supabase Provider configurado
- [ ] Client ID/Secret no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Teste local funcionando
- [ ] Deploy em produção testado

## 🔒 Segurança

### Boas Práticas
```bash
1. Nunca exponha Client Secret no frontend
2. Use HTTPS em produção
3. Configure domínios autorizados
4. Monitore logs de autenticação
5. Implemente rate limiting
```

### Escopos Necessários
```bash
Google OAuth Scopes:
- openid
- email
- profile
```

---

**🎬 ClipsForge - Autenticação segura e moderna! 🔐** 