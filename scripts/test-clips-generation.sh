#!/bin/bash

echo "🎬 TESTE ESPECÍFICO: GERAÇÃO DE CLIPS"
echo "====================================="

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

# Criar vídeo no banco de dados para teste
echo ""
echo "📹 Criando vídeo de teste no banco..."

TIMESTAMP=$(date +%s)
PUBLIC_ID="test-clips-${TIMESTAMP}"

CREATE_VIDEO_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/videos" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"title\": \"Vídeo de Teste Clips\",
    \"original_filename\": \"test-clips.mp4\",
    \"file_size_bytes\": 1500000,
    \"duration_seconds\": 240,
    \"processing_status\": \"generating_clips\",
    \"cloudinary_public_id\": \"${PUBLIC_ID}\",
    \"cloudinary_secure_url\": \"https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4\"
  }")

echo "📹 Resposta da criação do vídeo:"
echo $CREATE_VIDEO_RESPONSE | jq .

VIDEO_ID=$(echo $CREATE_VIDEO_RESPONSE | jq -r '.[0].id // empty')

if [ -z "$VIDEO_ID" ]; then
  echo "❌ Erro ao criar vídeo de teste"
  exit 1
fi

echo "✅ Vídeo criado - ID: $VIDEO_ID"

# Teste de geração de clips
echo ""
echo "🎬 Testando geração de clips..."

CLIP_SUGGESTIONS='[
  {
    "start_time": 10,
    "end_time": 45,
    "title": "💡 Como Começar do Zero",
    "viral_score": 88,
    "hook_strength": 92,
    "hashtags": ["#dicas", "#tutorial", "#começar"],
    "reason": "Gatilho forte no início com problema comum",
    "topic": "educativo",
    "emotions": ["curiosidade", "esperança"],
    "best_platforms": ["TikTok", "Instagram", "YouTube"],
    "content_category": "educativo"
  },
  {
    "start_time": 60,
    "end_time": 95,
    "title": "🔥 Estratégia Secreta Revelada",
    "viral_score": 95,
    "hook_strength": 89,
    "hashtags": ["#segredo", "#estratégia", "#viral"],
    "reason": "Contém palavra-chave viral e promessa de resultado",
    "topic": "educativo",
    "emotions": ["surpresa", "motivação"],
    "best_platforms": ["TikTok", "Instagram"],
    "content_category": "educativo"
  },
  {
    "start_time": 150,
    "end_time": 200,
    "title": "⚡ Transformação em 30 Dias",
    "viral_score": 82,
    "hook_strength": 85,
    "hashtags": ["#transformação", "#30dias", "#resultado"],
    "reason": "Promessa específica com prazo definido",
    "topic": "motivacional",
    "emotions": ["motivação", "esperança"],
    "best_platforms": ["Instagram", "YouTube"],
    "content_category": "motivacional"
  }
]'

CLIPS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/generate-clips" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\",
    \"clip_suggestions\": ${CLIP_SUGGESTIONS}
  }")

echo "📤 Resposta da geração de clips:"
echo $CLIPS_RESPONSE | jq .

SUCCESS=$(echo $CLIPS_RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Clips gerados com sucesso!"
  
  CLIPS_CREATED=$(echo $CLIPS_RESPONSE | jq -r '.clips_created // 0')
  echo "📊 Clips criados: $CLIPS_CREATED"
  
  # Listar clips criados
  echo "🎬 Lista de clips criados:"
  echo $CLIPS_RESPONSE | jq -r '.clips[] | "• " + .title + " (" + (.start_time|tostring) + "s-" + (.end_time|tostring) + "s)"'
  
  # Verificar clips no banco
  echo ""
  echo "🔍 Verificando clips no banco de dados..."
  
  DB_CLIPS=$(curl -s "${SUPABASE_URL}/rest/v1/clips?video_id=eq.${VIDEO_ID}&select=*" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "apikey: ${SUPABASE_KEY}")
  
  echo "📊 Clips no banco:"
  echo $DB_CLIPS | jq .
  
else
  echo "❌ Erro na geração de clips"
  ERROR=$(echo $CLIPS_RESPONSE | jq -r '.error // "Erro desconhecido"')
  echo "📋 Erro: $ERROR"
fi

echo ""
echo "🎉 TESTE DE GERAÇÃO DE CLIPS CONCLUÍDO" 