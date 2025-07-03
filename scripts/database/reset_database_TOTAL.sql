-- ========================================
-- RESET TOTAL DO BANCO - INCLUINDO USUÁRIOS
-- ========================================
-- Execute no Supabase Dashboard > SQL Editor

-- ⚠️ ATENÇÃO: Isso vai apagar TUDO, incluindo usuários!

-- 1. DELETAR TODOS OS DADOS (ordem importante devido às foreign keys)
DELETE FROM social_posts WHERE id IS NOT NULL;
DELETE FROM clips WHERE id IS NOT NULL;
DELETE FROM content_analysis WHERE id IS NOT NULL;
DELETE FROM videos WHERE id IS NOT NULL;
DELETE FROM social_accounts WHERE id IS NOT NULL;
DELETE FROM ayrshare_profiles WHERE id IS NOT NULL;
DELETE FROM api_keys WHERE id IS NOT NULL;
DELETE FROM subscriptions WHERE id IS NOT NULL;

-- 2. DELETAR TODOS OS PROFILES (usuários)
DELETE FROM profiles WHERE id IS NOT NULL;

-- 3. DELETAR USUÁRIOS DA AUTENTICAÇÃO (auth.users)
-- ⚠️ CUIDADO: Isso remove todos os usuários do sistema
DELETE FROM auth.users WHERE id IS NOT NULL;

-- 4. LIMPAR SESSIONS E REFRESH TOKENS
DELETE FROM auth.sessions WHERE id IS NOT NULL;
DELETE FROM auth.refresh_tokens WHERE id IS NOT NULL;

-- 5. VERIFICAR LIMPEZA TOTAL
SELECT 'videos' as tabela, COUNT(*) as registros FROM videos
UNION ALL
SELECT 'clips' as tabela, COUNT(*) as registros FROM clips
UNION ALL
SELECT 'content_analysis' as tabela, COUNT(*) as registros FROM content_analysis
UNION ALL
SELECT 'social_posts' as tabela, COUNT(*) as registros FROM social_posts
UNION ALL
SELECT 'social_accounts' as tabela, COUNT(*) as registros FROM social_accounts
UNION ALL
SELECT 'ayrshare_profiles' as tabela, COUNT(*) as registros FROM ayrshare_profiles
UNION ALL
SELECT 'api_keys' as tabela, COUNT(*) as registros FROM api_keys
UNION ALL
SELECT 'subscriptions' as tabela, COUNT(*) as registros FROM subscriptions
UNION ALL
SELECT 'profiles' as tabela, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'auth_users' as tabela, COUNT(*) as registros FROM auth.users;

-- ✅ BANCO COMPLETAMENTE LIMPO - ZERO USUÁRIOS 