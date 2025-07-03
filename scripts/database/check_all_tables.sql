-- ========================================
-- VERIFICAR TODAS AS TABELAS DO BANCO
-- ========================================
-- Execute no Supabase Dashboard > SQL Editor

-- 1. LISTAR TODAS AS TABELAS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. CONTAR REGISTROS EM CADA TABELA
SELECT 
  'api_keys' as tabela, COUNT(*) as registros FROM api_keys
UNION ALL
SELECT 
  'ayrshare_profiles' as tabela, COUNT(*) as registros FROM ayrshare_profiles
UNION ALL
SELECT 
  'clips' as tabela, COUNT(*) as registros FROM clips
UNION ALL
SELECT 
  'content_analysis' as tabela, COUNT(*) as registros FROM content_analysis
UNION ALL
SELECT 
  'profiles' as tabela, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 
  'social_accounts' as tabela, COUNT(*) as registros FROM social_accounts
UNION ALL
SELECT 
  'social_posts' as tabela, COUNT(*) as registros FROM social_posts
UNION ALL
SELECT 
  'subscriptions' as tabela, COUNT(*) as registros FROM subscriptions
UNION ALL
SELECT 
  'videos' as tabela, COUNT(*) as registros FROM videos
ORDER BY tabela; 