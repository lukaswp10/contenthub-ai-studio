#!/bin/bash

echo "🔧 Inserindo dados de teste no ClipsForge..."

# Encontrar o container do postgres
POSTGRES_CONTAINER=$(docker ps --filter "name=supabase_db" --format "{{.Names}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
  echo "❌ Container do Postgres não encontrado! Certifique-se de que o Supabase está rodando."
  exit 1
fi

echo "📦 Usando container: $POSTGRES_CONTAINER"

# Executar SQL diretamente no container
echo "📝 Executando SQL..."
docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d postgres << 'EOF'
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
EOF

echo ""
echo "✅ Dados de teste inseridos!"

# Verificar dados via API REST
echo ""
echo "🔍 Verificando dados via API..."
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "Videos:"
curl -s "http://127.0.0.1:54321/rest/v1/videos?select=id,title,user_id,processing_status&id=eq.22222222-2222-2222-2222-222222222222" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq .

echo ""
echo "Content Analysis:"
curl -s "http://127.0.0.1:54321/rest/v1/content_analysis?select=id,video_id,analysis_completed&video_id=eq.22222222-2222-2222-2222-222222222222" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq . 