-- Script para inserir dados de teste diretamente no banco
-- Executar como superuser para ignorar RLS

-- IDs fixos para facilitar debug
\set user_id '11111111-1111-1111-1111-111111111111'
\set video_id '22222222-2222-2222-2222-222222222222'
\set analysis_id '33333333-3333-3333-3333-333333333333'

-- Limpar dados anteriores
DELETE FROM clips WHERE video_id = :'video_id';
DELETE FROM content_analysis WHERE video_id = :'video_id';
DELETE FROM videos WHERE id = :'video_id';
DELETE FROM profiles WHERE id = :'user_id';

-- 1. Inserir usuário no auth.users
INSERT INTO auth.users (
  id, 
  instance_id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  :'user_id'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'test@clipsforge.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Test User"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = now();

-- 2. Inserir profile
INSERT INTO profiles (
  id,
  email,
  full_name,
  plan_type,
  created_at,
  updated_at
) VALUES (
  :'user_id'::uuid,
  'test@clipsforge.com',
  'Test User',
  'pro',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = now();

-- 3. Inserir vídeo
INSERT INTO videos (
  id,
  user_id,
  title,
  description,
  original_filename,
  file_size_bytes,
  duration_seconds,
  processing_status,
  cloudinary_public_id,
  cloudinary_secure_url,
  created_at,
  updated_at
) VALUES (
  :'video_id'::uuid,
  :'user_id'::uuid,
  'Vídeo de Teste',
  'Teste para generate-clips',
  'test.mp4',
  1024,
  60,
  'ready',
  'test_video',
  'https://res.cloudinary.com/test/video/upload/test_video.mp4',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = now();

-- 4. Inserir análise de conteúdo
INSERT INTO content_analysis (
  id,
  video_id,
  user_id,
  clips_suggestions,
  analysis_completed,
  created_at,
  updated_at
) VALUES (
  :'analysis_id'::uuid,
  :'video_id'::uuid,
  :'user_id'::uuid,
  '[
    {
      "start_time": 5,
      "end_time": 35,
      "duration": 30,
      "title": "Clip Viral Incrível",
      "description": "Um momento épico do vídeo",
      "viral_score": 8.5,
      "hook_strength": 9.2,
      "best_platforms": ["tiktok", "instagram", "youtube"],
      "content_category": "entretenimento",
      "hashtags": ["#viral", "#incrivel", "#clips"]
    },
    {
      "start_time": 20,
      "end_time": 50,
      "duration": 30,
      "title": "Momento Épico",
      "description": "Sequência incrível",
      "viral_score": 7.8,
      "hook_strength": 8.1,
      "best_platforms": ["instagram", "youtube", "tiktok"],
      "content_category": "entretenimento",
      "hashtags": ["#epico", "#viral", "#momento"]
    }
  ]'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  clips_suggestions = EXCLUDED.clips_suggestions,
  analysis_completed = EXCLUDED.analysis_completed,
  updated_at = now();

-- Verificar dados inseridos
SELECT 'PROFILES' as table_name, count(*) as count FROM profiles WHERE id = :'user_id'
UNION ALL
SELECT 'VIDEOS' as table_name, count(*) as count FROM videos WHERE id = :'video_id'
UNION ALL
SELECT 'CONTENT_ANALYSIS' as table_name, count(*) as count FROM content_analysis WHERE video_id = :'video_id';

-- Mostrar dados inseridos
SELECT 'Video criado:' as info, id, title, user_id, processing_status FROM videos WHERE id = :'video_id';
SELECT 'Análise criada:' as info, id, video_id, analysis_completed FROM content_analysis WHERE video_id = :'video_id';

\echo 'Dados de teste inseridos com sucesso!'
\echo 'User ID:' :user_id
\echo 'Video ID:' :video_id
\echo 'Analysis ID:' :analysis_id 