# 🚀 Guia de Deploy das Edge Functions

## Problema Identificado
O OAuth ainda está usando URLs demo porque as Edge Functions do Supabase não foram deployadas.

## Solução: Deploy Manual das Edge Functions

### 1. Acesse o Dashboard do Supabase
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Selecione o projeto `contenthub-ai-studio`

### 2. Configure as Variáveis de Ambiente
- Vá em **Settings** > **Edge Functions**
- Adicione a variável:
  ```
  AYRSHARE_API_KEY=sua_chave_ayrshare_aqui
  ```

### 3. Deploy das Edge Functions

#### Opção A: Via Dashboard (Recomendado)
1. Vá em **Edge Functions** no menu lateral
2. Clique em **"Deploy"** para cada função:
   - `connect-social-account`
   - `complete-oauth`
   - `refresh-social-account`

#### Opção B: Via CLI (se disponível)
```bash
# Instalar Supabase CLI
curl -fsSL https://supabase.com/install.sh | sh

# Login
supabase login

# Link do projeto
supabase link --project-ref seu_project_ref

# Deploy das funções
supabase functions deploy connect-social-account
supabase functions deploy complete-oauth
supabase functions deploy refresh-social-account
```

### 4. Verificar o Deploy
Após o deploy, teste a conexão:
1. Acesse [https://contenthub-ai-studio.vercel.app/automation](https://contenthub-ai-studio.vercel.app/automation)
2. Tente conectar uma conta do Instagram
3. Deve abrir a URL real do Ayrshare, não mais a demo

### 5. Logs e Debug
Se ainda houver problemas:
- Vá em **Edge Functions** > **Logs**
- Verifique os logs da função `connect-social-account`
- Procure por erros relacionados à `AYRSHARE_API_KEY`

## Status Atual
- ✅ Frontend atualizado (Vercel)
- ❌ Edge Functions não deployadas (Supabase)
- ❌ OAuth ainda usando URLs demo

## Próximos Passos
1. Deploy das Edge Functions no Supabase
2. Configurar `AYRSHARE_API_KEY`
3. Testar conexão real 