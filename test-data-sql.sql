-- Inserir dados de teste para ClipsForge
-- 1. Usuário auth
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) 
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'test@clipsforge.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider": "email"}', '{"full_name": "Test User"}') 
ON CONFLICT (id) DO NOTHING;

-- 2. Profile
INSERT INTO profiles (id, email, full_name, plan_type) 
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'test@clipsforge.com', 'Test User', 'pro') 
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  plan_type = EXCLUDED.plan_type;

-- 3. Vídeo
INSERT INTO videos (id, user_id, title, original_filename, file_size_bytes, duration_seconds, processing_status, cloudinary_public_id, cloudinary_secure_url) 
VALUES ('22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Vídeo de Teste', 'test.mp4', 1024, 60, 'ready', 'test_video', 'https://res.cloudinary.com/test/video/upload/test_video.mp4') 
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  processing_status = EXCLUDED.processing_status;

-- 4. Análise
INSERT INTO content_analysis (id, video_id, user_id, clips_suggestions, analysis_completed) 
VALUES ('33333333-3333-3333-3333-333333333333'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '[{"start_time": 5, "end_time": 35, "duration": 30, "title": "Clip Viral", "description": "Momento épico", "viral_score": 8.5, "hook_strength": 9.2, "best_platforms": ["tiktok"], "content_category": "entretenimento", "hashtags": ["#viral"]}]'::jsonb, true) 
ON CONFLICT (id) DO UPDATE SET 
  clips_suggestions = EXCLUDED.clips_suggestions,
  analysis_completed = EXCLUDED.analysis_completed;

-- 5. Verificar
SELECT 'Dados inseridos:' as status, 
(SELECT count(*) FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111') as profiles,
(SELECT count(*) FROM videos WHERE id = '22222222-2222-2222-2222-222222222222') as videos,
(SELECT count(*) FROM content_analysis WHERE video_id = '22222222-2222-2222-2222-222222222222') as analysis; 