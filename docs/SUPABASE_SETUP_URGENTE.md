# 🚨 CONFIGURAÇÃO URGENTE - SUPABASE

## Problema Identificado
- Erro: `Refused to connect to 'https://placeholder.supabase.co/auth/v1/signup'`
- **Causa:** Variáveis de ambiente não configuradas

## ✅ SOLUÇÃO RÁPIDA

### 1. Obter Credenciais do Supabase

**Opção A: Se você JÁ tem um projeto Supabase:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings → API
4. Copie:
   - `Project URL` (ex: https://abcdefghijklmnop.supabase.co)
   - `anon public key` (ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)

**Opção B: Se você NÃO tem um projeto Supabase:**
1. Acesse: https://supabase.com/dashboard
2. Clique em "New project"
3. Escolha organização
4. Nome: `clipsforge`
5. Senha do banco (ANOTE!)
6. Região: `South America (São Paulo)`
7. Aguarde criação (~2 minutos)
8. Copie URL e anon key

### 2. Configurar Variáveis no Vercel

```bash
# Instalar CLI do Vercel se não tiver
npm i -g vercel

# Login no Vercel
vercel login

# Configurar variáveis de ambiente
vercel env add VITE_SUPABASE_URL
# Cole sua URL do Supabase quando solicitado

vercel env add VITE_SUPABASE_ANON_KEY  
# Cole sua chave anon quando solicitado

# Fazer novo deploy
vercel --prod
```

### 3. Configurar Localmente

Crie arquivo `.env.local`:
```bash
VITE_SUPABASE_URL=sua-url-aqui
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 4. Testar

```bash
# Local
npm run dev

# Produção
# Acesse https://clipsforge.vercel.app
```

## 📋 Checklist de Verificação

- [ ] Projeto Supabase criado/existente
- [ ] URL e anon key copiadas
- [ ] Variáveis configuradas no Vercel
- [ ] Arquivo .env.local criado
- [ ] Deploy feito
- [ ] Teste de registro funcionando

## 🆘 Se Ainda Não Funcionar

1. Verifique se as variáveis estão corretas no Vercel dashboard
2. Confirme que o projeto Supabase está ativo
3. Teste primeiro localmente com `npm run dev`
4. Verifique console do navegador para outros erros

## 📞 Próximos Passos

1. **CONFIGURAR SUPABASE AGORA**
2. Testar registro de usuário
3. Confirmar login funcionando
4. Prosseguir para Fase 2 (Upload de Vídeos) 