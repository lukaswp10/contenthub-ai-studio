
-- Inserir dados de teste simples
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin) VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@clipsforge.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider": "email"}', '{"full_name": "Test User"}', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, plan_type) VALUES 
('11111111-1111-1111-1111-111111111111', 'test@clipsforge.com', 'Test User', 'pro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO videos (id, user_id, title, original_filename, file_size_bytes, duration_seconds, processing_status, cloudinary_public_id, cloudinary_secure_url) VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Vídeo de Teste', 'test.mp4', 1024, 60, 'ready', 'test_video', 'https://res.cloudinary.com/test/video/upload/test_video.mp4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO content_analysis (id, video_id, user_id, clips_suggestions, analysis_completed) VALUES 
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 
'[{"start_time": 5, "end_time": 35, "duration": 30, "title": "Clip Viral", "description": "Momento épico", "viral_score": 8.5, "hook_strength": 9.2, "best_platforms": ["tiktok"], "content_category": "entretenimento", "hashtags": ["#viral"]}]'::jsonb, 
true)
ON CONFLICT (id) DO NOTHING;

