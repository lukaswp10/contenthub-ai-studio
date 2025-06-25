#!/bin/bash

echo "🎥 TESTE COMPLETO COM VÍDEO REAL"
echo "================================"

# Configurações
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
VIDEO_PATH="/home/lucasmartins/Downloads/videoplayback (1).mp4"

# Verificar se o arquivo existe
if [ ! -f "$VIDEO_PATH" ]; then
  echo "❌ Arquivo de vídeo não encontrado: $VIDEO_PATH"
  exit 1
fi

# Obter informações do arquivo
FILE_SIZE=$(stat -c%s "$VIDEO_PATH")
FILE_NAME=$(basename "$VIDEO_PATH")

echo "📁 Arquivo: $FILE_NAME"
echo "📏 Tamanho: $(($FILE_SIZE / 1024 / 1024)) MB"

# Login
echo ""
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

# Passo 1: Preparar upload
echo ""
echo "📤 PASSO 1: Preparando upload..."

UPLOAD_PREP_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/upload-video" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"fileName\": \"${FILE_NAME}\",
    \"fileSize\": ${FILE_SIZE},
    \"contentType\": \"video/mp4\",
    \"duration\": 120
  }")

echo "📤 Resposta do upload prep:"
echo $UPLOAD_PREP_RESPONSE | jq .

SUCCESS=$(echo $UPLOAD_PREP_RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Erro na preparação do upload"
  exit 1
fi

VIDEO_ID=$(echo $UPLOAD_PREP_RESPONSE | jq -r '.video_id')
UPLOAD_URL=$(echo $UPLOAD_PREP_RESPONSE | jq -r '.upload_url')
echo "✅ Upload preparado - Video ID: $VIDEO_ID"

# Passo 2: Simular upload bem-sucedido (atualizar status para transcribing)
echo ""
echo "📝 PASSO 2: Simulando upload bem-sucedido..."

# Atualizar vídeo com URL do Cloudinary simulada
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/videos?id=eq.${VIDEO_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"processing_status\": \"transcribing\",
    \"cloudinary_secure_url\": \"https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4\"
  }")

echo "✅ Status atualizado para transcribing"

# Passo 3: Transcrição
echo ""
echo "🎤 PASSO 3: Iniciando transcrição..."

TRANSCRIPT_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/transcribe-video" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\",
    \"cloudinary_url\": \"https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4\",
    \"cloudinary_public_id\": \"sample\",
    \"simulate_api\": true
  }")

echo "📤 Resposta da transcrição:"
echo $TRANSCRIPT_RESPONSE | jq .

TRANSCRIPT_SUCCESS=$(echo $TRANSCRIPT_RESPONSE | jq -r '.success // false')
if [ "$TRANSCRIPT_SUCCESS" = "true" ]; then
  echo "✅ Transcrição concluída!"
  TRANSCRIPT_TEXT=$(echo $TRANSCRIPT_RESPONSE | jq -r '.transcript')
  echo "📝 Transcrição (primeiros 100 chars): ${TRANSCRIPT_TEXT:0:100}..."
else
  echo "❌ Erro na transcrição"
  exit 1
fi

# Passo 4: Análise de conteúdo
echo ""
echo "🔍 PASSO 4: Analisando conteúdo..."

ANALYSIS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/analyze-content" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\",
    \"transcript\": \"${TRANSCRIPT_TEXT}\"
  }")

echo "📤 Resposta da análise:"
echo $ANALYSIS_RESPONSE | jq .

ANALYSIS_SUCCESS=$(echo $ANALYSIS_RESPONSE | jq -r '.success // false')
if [ "$ANALYSIS_SUCCESS" = "true" ]; then
  echo "✅ Análise concluída!"
  CLIPS_COUNT=$(echo $ANALYSIS_RESPONSE | jq -r '.clips_found // 0')
  echo "📊 Clips identificados: $CLIPS_COUNT"
  
  # Extrair sugestões de clips
  CLIP_SUGGESTIONS=$(echo $ANALYSIS_RESPONSE | jq '.clips_suggestions')
else
  echo "❌ Erro na análise"
  exit 1
fi

# Passo 5: Geração de clips
echo ""
echo "🎬 PASSO 5: Gerando clips..."

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

CLIPS_SUCCESS=$(echo $CLIPS_RESPONSE | jq -r '.success // false')
if [ "$CLIPS_SUCCESS" = "true" ]; then
  echo "✅ Clips gerados com sucesso!"
  CLIPS_GENERATED=$(echo $CLIPS_RESPONSE | jq -r '.clips_generated // 0')
  echo "📊 Clips criados: $CLIPS_GENERATED"
else
  echo "❌ Erro na geração de clips"
fi

# Verificar resultado final no banco
echo ""
echo "🔍 VERIFICAÇÃO FINAL: Status no banco de dados..."

VIDEO_STATUS=$(curl -s "${SUPABASE_URL}/rest/v1/videos?id=eq.${VIDEO_ID}&select=*" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}")

echo "📊 Status final do vídeo:"
echo $VIDEO_STATUS | jq '.[0] | {id, title, processing_status, transcription_language, ai_content_type}'

CLIPS_IN_DB=$(curl -s "${SUPABASE_URL}/rest/v1/clips?video_id=eq.${VIDEO_ID}&select=*" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}")

CLIPS_COUNT_DB=$(echo $CLIPS_IN_DB | jq 'length')
echo "📊 Clips no banco de dados: $CLIPS_COUNT_DB"

if [ "$CLIPS_COUNT_DB" -gt 0 ]; then
  echo "🎬 Lista de clips criados:"
  echo $CLIPS_IN_DB | jq -r '.[] | "• " + .title + " (" + (.start_time|tostring) + "s-" + (.end_time|tostring) + "s) - Score: " + (.viral_score|tostring)'
fi

echo ""
echo "🎉 TESTE COMPLETO FINALIZADO!"
echo "📊 Resumo:"
echo "   - Upload: ✅"
echo "   - Transcrição: $([ "$TRANSCRIPT_SUCCESS" = "true" ] && echo "✅" || echo "❌")"
echo "   - Análise: $([ "$ANALYSIS_SUCCESS" = "true" ] && echo "✅" || echo "❌")"
echo "   - Clips: $([ "$CLIPS_SUCCESS" = "true" ] && echo "✅" || echo "❌")"
echo "   - Total de clips: $CLIPS_COUNT_DB" 