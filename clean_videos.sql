-- =====================================================
-- QUERIES PARA LIMPAR TODOS OS VÍDEOS DO BANCO
-- =====================================================

-- 1. VER TODOS OS VÍDEOS ANTES DE LIMPAR
SELECT 
    id,
    title,
    original_filename,
    processing_status,
    created_at,
    cloudinary_public_id
FROM videos 
ORDER BY created_at DESC;

-- 2. CONTAR QUANTOS VÍDEOS EXISTEM
SELECT COUNT(*) as total_videos FROM videos;

-- 3. LIMPAR TODOS OS VÍDEOS (CUIDADO!)
DELETE FROM videos;

-- 4. VERIFICAR SE FOI LIMPO
SELECT COUNT(*) as videos_restantes FROM videos;

-- 5. RESETAR SEQUENCE DO ID (se necessário)
-- ALTER SEQUENCE videos_id_seq RESTART WITH 1;

-- =====================================================
-- QUERIES ESPECÍFICAS POR STATUS
-- =====================================================

-- Ver vídeos com erro
SELECT * FROM videos WHERE processing_status = 'failed';

-- Ver vídeos em processamento
SELECT * FROM videos WHERE processing_status IN ('uploading', 'queued', 'transcribing', 'analyzing', 'generating_clips');

-- Ver vídeos prontos
SELECT * FROM videos WHERE processing_status = 'ready';

-- =====================================================
-- LIMPAR APENAS VÍDEOS COM ERRO
-- =====================================================

-- DELETE FROM videos WHERE processing_status = 'failed';

-- =====================================================
-- LIMPAR APENAS VÍDEOS ANTIGOS (mais de 7 dias)
-- =====================================================

-- DELETE FROM videos WHERE created_at < NOW() - INTERVAL '7 days';

-- =====================================================
-- LIMPAR APENAS VÍDEOS DE UM USUÁRIO ESPECÍFICO
-- =====================================================

-- Substitua 'USER_ID_AQUI' pelo ID do usuário
-- DELETE FROM videos WHERE user_id = 'USER_ID_AQUI';

-- =====================================================
-- VERIFICAR USAGE DO USUÁRIO
-- =====================================================

-- Ver usage atual
SELECT 
    id,
    email,
    usage_videos_current_month,
    usage_storage_bytes,
    plan_type
FROM profiles 
WHERE id = '4dd38ef4-f5fc-449e-bd4f-529716036acf'; -- Seu user_id

-- Resetar usage (se necessário)
-- UPDATE profiles 
-- SET usage_videos_current_month = 0, 
--     usage_storage_bytes = 0 
-- WHERE id = '4dd38ef4-f5fc-449e-bd4f-529716036acf'; 