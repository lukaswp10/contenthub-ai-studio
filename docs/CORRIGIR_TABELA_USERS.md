# 🔧 CORRIGIR TABELA USERS NO SUPABASE

## 🚨 PROBLEMA IDENTIFICADO:
A tabela `users` não tem as colunas necessárias:
- ❌ Faltando: `full_name` (varchar)
- ❌ Faltando: `credits_limit` (integer)

## ✅ SOLUÇÃO - EXECUTE NO SUPABASE:

### 1. Acesse: https://supabase.com/dashboard
### 2. Projeto: ClipBursts
### 3. Vá em: SQL Editor
### 4. Cole este SQL:

```sql
-- Adicionar colunas faltantes na tabela users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS credits_limit INTEGER DEFAULT 30;

-- Atualizar registros existentes que não têm credits_limit
UPDATE public.users 
SET credits_limit = 30 
WHERE credits_limit IS NULL;
```

### 5. Clique: **Run**

## 🔍 VERIFICAR SE DEU CERTO:

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

## ✅ RESULTADO ESPERADO:
A tabela deve ter essas colunas:
- id (uuid)
- email (varchar)
- full_name (varchar) ← NOVA
- plan (varchar)
- credits_used (integer)
- credits_limit (integer) ← NOVA
- created_at (timestamp) 