#!/bin/bash

# Script simples para testar generate-clips
set -e

echo "🎬 Teste Simples Generate-Clips"
echo "================================"

# Configurações
SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# 1. Criar usuário
echo "📝 1. Criando usuário..."
USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo "User ID: $USER_ID"

curl -X POST "$SUPABASE_URL/rest/v1/profiles" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"id\": \"$USER_ID\",
    \"email\": \"test@clipsforge.com\",
    \"full_name\": \"Test User\",
    \"plan_type\": \"pro\"
  }"

echo "✅ Usuário criado"

# 2. Criar vídeo
echo "📝 2. Criando vídeo..."
VIDEO_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo "Video ID: $VIDEO_ID"

curl -X POST "$SUPABASE_URL/rest/v1/videos" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"id\": \"$VIDEO_ID\",
    \"user_id\": \"$USER_ID\",
    \"title\": \"Vídeo de Teste\",
    \"description\": \"Teste para generate-clips\",
    \"original_filename\": \"test.mp4\",
    \"file_size_bytes\": 1024,
    \"duration_seconds\": 60,
    \"processing_status\": \"ready\",
    \"cloudinary_public_id\": \"test_video\",
    \"cloudinary_secure_url\": \"https://res.cloudinary.com/test/video/upload/test_video.mp4\"
  }"

echo "✅ Vídeo criado"

# 3. Criar análise de conteúdo
echo "📝 3. Criando análise de conteúdo..."
ANALYSIS_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

curl -X POST "$SUPABASE_URL/rest/v1/content_analysis" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"id\": \"$ANALYSIS_ID\",
    \"video_id\": \"$VIDEO_ID\",
    \"user_id\": \"$USER_ID\",
    \"clips_suggestions\": [
      {
        \"start_time\": 5,
        \"end_time\": 35,
        \"duration\": 30,
        \"title\": \"Clip Viral Incrível\",
        \"description\": \"Um momento épico do vídeo\",
        \"viral_score\": 8.5,
        \"hook_strength\": 9.2,
        \"best_platforms\": [\"tiktok\", \"instagram\", \"youtube\"],
        \"content_category\": \"entretenimento\",
        \"hashtags\": [\"#viral\", \"#incrivel\", \"#clips\"]
      },
      {
        \"start_time\": 20,
        \"end_time\": 50,
        \"duration\": 30,
        \"title\": \"Momento Épico\",
        \"description\": \"Sequência incrível\",
        \"viral_score\": 7.8,
        \"hook_strength\": 8.1,
        \"best_platforms\": [\"instagram\", \"youtube\", \"tiktok\"],
        \"content_category\": \"entretenimento\",
        \"hashtags\": [\"#epico\", \"#viral\", \"#momento\"]
      }
    ],
    \"analysis_completed\": true
  }"

echo "✅ Análise criada"

# 4. Testar generate-clips
echo "📝 4. Testando generate-clips..."
echo "Chamando função generate-clips..."

RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/generate-clips" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\": \"$VIDEO_ID\"}")

echo "📄 Resposta da função:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# 5. Verificar clips criados
echo "📝 5. Verificando clips no banco..."
CLIPS=$(curl -s -X GET "$SUPABASE_URL/rest/v1/clips?video_id=eq.$VIDEO_ID" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY")

CLIPS_COUNT=$(echo "$CLIPS" | jq '. | length' 2>/dev/null || echo "0")
echo "📊 Clips encontrados: $CLIPS_COUNT"

if [ "$CLIPS_COUNT" -gt 0 ]; then
  echo "🎉 SUCESSO! Clips foram gerados:"
  echo "$CLIPS" | jq -r '.[] | "• " + .title + " (" + (.duration_seconds|tostring) + "s) - Score: " + (.ai_viral_score|tostring)' 2>/dev/null || echo "$CLIPS"
else
  echo "❌ FALHA: Nenhum clip foi gerado"
fi

echo ""
echo "🔍 IDs para debug:"
echo "User ID: $USER_ID"
echo "Video ID: $VIDEO_ID"
echo "Analysis ID: $ANALYSIS_ID" 