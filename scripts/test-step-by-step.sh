#!/bin/bash

echo "🧪 TESTE PASSO-A-PASSO"
echo "======================"

# Configurações
VIDEO_PATH="/home/lucasmartins/Downloads/videoplayback (1).mp4"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Verificar se arquivo existe
if [ ! -f "$VIDEO_PATH" ]; then
  echo "❌ Arquivo não encontrado: $VIDEO_PATH"
  exit 1
fi

echo "📁 Arquivo encontrado: $(ls -lh "$VIDEO_PATH")"

# Login
echo ""
echo "🔐 PASSO 1: Login"
echo "-----------------"
LOGIN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Erro no login:"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Login realizado com sucesso"

# Upload
echo ""
echo "📤 PASSO 2: Upload do Vídeo"  
echo "---------------------------"

UPLOAD_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/upload-video" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -F "file=@${VIDEO_PATH}" \
  -F "title=Teste Passo a Passo" \
  -F "description=Teste sistemático das funções")

echo "📤 Resposta do upload:"
echo $UPLOAD_RESPONSE | jq .

SUCCESS=$(echo $UPLOAD_RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Erro no upload"
  exit 1
fi

VIDEO_ID=$(echo $UPLOAD_RESPONSE | jq -r '.video_id')
echo "✅ Upload realizado - Video ID: $VIDEO_ID"

# Aguardar processamento inicial
echo ""
echo "⏳ PASSO 3: Aguardar Processamento Inicial"
echo "------------------------------------------"
sleep 5

# Verificar status
STATUS_RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/videos?id=eq.${VIDEO_ID}&select=*" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}")

echo "📊 Status do vídeo:"
echo $STATUS_RESPONSE | jq '.[]' 

STATUS=$(echo $STATUS_RESPONSE | jq -r '.[0].processing_status // "unknown"')
echo "📊 Status atual: $STATUS"

# Transcrever
echo ""
echo "🎤 PASSO 4: Transcrição"
echo "-----------------------"

CLOUDINARY_URL=$(echo $STATUS_RESPONSE | jq -r '.[0].cloudinary_url // empty')
if [ -z "$CLOUDINARY_URL" ]; then
  echo "⚠️ URL do Cloudinary não disponível, usando placeholder"
  CLOUDINARY_URL="https://test-cloudinary.com/video.mp4"
fi

TRANSCRIPT_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/transcribe-video" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\",
    \"cloudinary_url\": \"${CLOUDINARY_URL}\",
    \"simulate_api\": true
  }")

echo "📤 Resposta da transcrição:"
echo $TRANSCRIPT_RESPONSE | jq .

TRANSCRIPT_SUCCESS=$(echo $TRANSCRIPT_RESPONSE | jq -r '.success // false')
if [ "$TRANSCRIPT_SUCCESS" != "true" ]; then
  echo "❌ Erro na transcrição"
  exit 1
fi

TRANSCRIPT=$(echo $TRANSCRIPT_RESPONSE | jq -r '.transcript.text // empty')
echo "✅ Transcrição realizada (${#TRANSCRIPT} caracteres)"

# Análise
echo ""
echo "🔍 PASSO 5: Análise de Conteúdo"
echo "-------------------------------"

ANALYSIS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/analyze-content" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\",
    \"transcript\": \"${TRANSCRIPT}\"
  }")

echo "📤 Resposta da análise:"
echo $ANALYSIS_RESPONSE | jq .

ANALYSIS_SUCCESS=$(echo $ANALYSIS_RESPONSE | jq -r '.success // false')
if [ "$ANALYSIS_SUCCESS" != "true" ]; then
  echo "❌ Erro na análise"
  exit 1
fi

CLIPS_COUNT=$(echo $ANALYSIS_RESPONSE | jq -r '.clips_found // 0')
echo "✅ Análise realizada - $CLIPS_COUNT clips identificados"

# Geração de clips
echo ""
echo "🎬 PASSO 6: Geração de Clips"
echo "----------------------------"

CLIPS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/generate-clips" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\"
  }")

echo "📤 Resposta da geração de clips:"
echo $CLIPS_RESPONSE | jq .

echo ""
echo "🎉 TESTE PASSO-A-PASSO CONCLUÍDO"
echo "================================"
echo "📹 Video ID: $VIDEO_ID"
echo "📊 Status: $STATUS"
echo "🎤 Transcrição: $([ "$TRANSCRIPT_SUCCESS" = "true" ] && echo "✅" || echo "❌")"
echo "🔍 Análise: $([ "$ANALYSIS_SUCCESS" = "true" ] && echo "✅ ($CLIPS_COUNT clips)" || echo "❌")" 