#!/bin/bash

echo "🎬 TESTE DETALHADO: GERAÇÃO DE CLIPS"
echo "===================================="

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
  exit 1
fi

echo "✅ Login OK - User ID: $USER_ID"

# Criar vídeo completo para teste
echo ""
echo "📹 Criando vídeo de teste completo..."

TIMESTAMP=$(date +%s)
PUBLIC_ID="test-clips-detailed-${TIMESTAMP}"

CREATE_VIDEO_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/videos" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"title\": \"Vídeo Teste Clips Detalhado\",
    \"original_filename\": \"test-detailed.mp4\",
    \"file_size_bytes\": 2000000,
    \"duration_seconds\": 120,
    \"processing_status\": \"generating_clips\",
    \"cloudinary_public_id\": \"${PUBLIC_ID}\",
    \"cloudinary_secure_url\": \"https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4\",
    \"transcription\": {
      \"text\": \"Este é um vídeo sobre estratégias de crescimento nas redes sociais. Vou compartilhar dicas importantes sobre engajamento, timing e criação de conteúdo viral.\",
      \"segments\": [
        {\"start\": 0, \"end\": 30, \"text\": \"Este é um vídeo sobre estratégias de crescimento nas redes sociais.\"},
        {\"start\": 30, \"end\": 60, \"text\": \"Vou compartilhar dicas importantes sobre engajamento.\"},
        {\"start\": 60, \"end\": 90, \"text\": \"Também falaremos sobre timing e criação de conteúdo.\"},
        {\"start\": 90, \"end\": 120, \"text\": \"Por fim, estratégias para conteúdo viral.\"}
      ]
    }
  }")

VIDEO_ID=$(echo $CREATE_VIDEO_RESPONSE | jq -r '.[0].id // empty')

if [ -z "$VIDEO_ID" ]; then
  echo "❌ Erro ao criar vídeo"
  echo $CREATE_VIDEO_RESPONSE | jq .
  exit 1
fi

echo "✅ Vídeo criado - ID: $VIDEO_ID"

# Criar análise de conteúdo com clips
echo ""
echo "🔍 Criando análise de conteúdo..."

ANALYSIS_DATA='{
  "video_id": "'$VIDEO_ID'",
  "user_id": "'$USER_ID'",
  "clips_suggestions": [
    {
      "start_time": 0,
      "end_time": 30,
      "title": "🔥 Estratégias de Crescimento",
      "viral_score": 85,
      "hook_strength": 90,
      "hashtags": ["#crescimento", "#redessociais", "#dicas"],
      "reason": "Introdução forte com promessa de valor",
      "topic": "educativo",
      "emotions": ["curiosidade", "interesse"],
      "best_platforms": ["TikTok", "Instagram"],
      "content_category": "educativo"
    },
    {
      "start_time": 30,
      "end_time": 60,
      "title": "💡 Segredos do Engajamento",
      "viral_score": 92,
      "hook_strength": 88,
      "hashtags": ["#engajamento", "#segredos", "#viral"],
      "reason": "Conteúdo específico sobre engajamento",
      "topic": "educativo",
      "emotions": ["surpresa", "motivação"],
      "best_platforms": ["TikTok", "YouTube"],
      "content_category": "educativo"
    },
    {
      "start_time": 60,
      "end_time": 90,
      "title": "⏰ Timing Perfeito Para Postar",
      "viral_score": 78,
      "hook_strength": 82,
      "hashtags": ["#timing", "#quando", "#postar"],
      "reason": "Informação prática e útil",
      "topic": "educativo",
      "emotions": ["interesse", "aprendizado"],
      "best_platforms": ["Instagram", "YouTube"],
      "content_category": "educativo"
    }
  ],
  "analysis_completed": true
}'

CREATE_ANALYSIS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/content_analysis" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$ANALYSIS_DATA")

echo "📊 Análise criada:"
echo $CREATE_ANALYSIS_RESPONSE | jq .

# Testar geração de clips
echo ""
echo "🎬 Testando geração de clips..."

CLIPS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/generate-clips" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\"
  }")

echo "📤 Resposta completa da geração:"
echo $CLIPS_RESPONSE | jq .

SUCCESS=$(echo $CLIPS_RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Função executou com sucesso!"
  
  CLIPS_GENERATED=$(echo $CLIPS_RESPONSE | jq -r '.clips_generated // 0')
  echo "📊 Clips gerados: $CLIPS_GENERATED"
  
  if [ "$CLIPS_GENERATED" -gt 0 ]; then
    echo "🎬 Detalhes dos clips:"
    echo $CLIPS_RESPONSE | jq -r '.clips[] | "• " + .title + " (ID: " + .id + ") - Status: " + .status'
  fi
else
  echo "❌ Erro na geração de clips"
  ERROR=$(echo $CLIPS_RESPONSE | jq -r '.error // "Erro desconhecido"')
  echo "📋 Erro: $ERROR"
  
  # Mostrar debug se disponível
  DEBUG=$(echo $CLIPS_RESPONSE | jq -r '.debug // empty')
  if [ ! -z "$DEBUG" ]; then
    echo "🐛 Debug info:"
    echo $DEBUG | jq .
  fi
fi

# Verificar clips no banco
echo ""
echo "🔍 Verificando clips no banco de dados..."

DB_CLIPS=$(curl -s "${SUPABASE_URL}/rest/v1/clips?video_id=eq.${VIDEO_ID}&select=*" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}")

CLIPS_COUNT_DB=$(echo $DB_CLIPS | jq 'length')
echo "📊 Clips encontrados no banco: $CLIPS_COUNT_DB"

if [ "$CLIPS_COUNT_DB" -gt 0 ]; then
  echo "🎬 Lista de clips no banco:"
  echo $DB_CLIPS | jq -r '.[] | "• " + .title + " (" + (.start_time_seconds|tostring) + "s-" + (.end_time_seconds|tostring) + "s) - Status: " + .status + " - Score: " + (.ai_viral_score|tostring)'
else
  echo "⚠️ Nenhum clip encontrado no banco"
fi

# Verificar logs das edge functions
echo ""
echo "📋 Verificando logs das edge functions..."
echo "(Execute 'supabase functions logs generate-clips' para ver logs detalhados)"

echo ""
echo "🎉 TESTE DETALHADO CONCLUÍDO" 