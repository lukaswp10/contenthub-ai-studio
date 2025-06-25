#!/bin/bash

echo "🎤 TESTE ESPECÍFICO: TRANSCRIÇÃO"
echo "================================"

# Configurações
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Login
echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // empty')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Erro no login"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login OK - User ID: $USER_ID"

# Primeiro, criar um vídeo no banco de dados para teste
echo ""
echo "📹 Criando vídeo de teste no banco..."

TIMESTAMP=$(date +%s)
PUBLIC_ID="test-video-${TIMESTAMP}"

CREATE_VIDEO_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/videos" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"title\": \"Vídeo de Teste Transcrição\",
    \"original_filename\": \"test-video.mp4\",
    \"file_size_bytes\": 1000000,
    \"duration_seconds\": 120,
    \"processing_status\": \"uploading\",
    \"cloudinary_public_id\": \"${PUBLIC_ID}\",
    \"cloudinary_secure_url\": \"https://test-url.com/video.mp4\"
  }")

echo "📹 Resposta da criação do vídeo:"
echo $CREATE_VIDEO_RESPONSE | jq .

VIDEO_ID=$(echo $CREATE_VIDEO_RESPONSE | jq -r '.[0].id // empty')

if [ -z "$VIDEO_ID" ]; then
  echo "❌ Erro ao criar vídeo de teste"
  exit 1
fi

echo "✅ Vídeo criado - ID: $VIDEO_ID"

# Teste de transcrição
echo ""
echo "🎤 Testando transcrição..."

TRANSCRIPT_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/transcribe-video" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\",
    \"cloudinary_url\": \"https://test-url.com/video.mp4\",
    \"cloudinary_public_id\": \"${PUBLIC_ID}\",
    \"simulate_api\": true
  }")

echo "📤 Resposta da transcrição:"
echo $TRANSCRIPT_RESPONSE | jq .

SUCCESS=$(echo $TRANSCRIPT_RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Transcrição realizada com sucesso!"
  
  TRANSCRIPT=$(echo $TRANSCRIPT_RESPONSE | jq -r '.transcript // empty')
  echo "📝 Transcrição (primeiros 200 chars): ${TRANSCRIPT:0:200}..."
  
  # Verificar se foi salva no banco
  echo ""
  echo "🔍 Verificando no banco de dados..."
  
  DB_RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/videos?id=eq.${VIDEO_ID}&select=transcription,processing_status" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "apikey: ${SUPABASE_KEY}")
  
  echo "📊 Status no banco:"
  echo $DB_RESPONSE | jq .
  
else
  echo "❌ Erro na transcrição"
  ERROR=$(echo $TRANSCRIPT_RESPONSE | jq -r '.error // "Erro desconhecido"')
  echo "📋 Erro: $ERROR"
fi

echo ""
echo "🎉 TESTE DE TRANSCRIÇÃO CONCLUÍDO" 