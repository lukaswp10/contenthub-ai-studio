#!/bin/bash

echo "🎬 Teste COMPLETO com Upload Real de Vídeo"
echo "=========================================="

# Configurações de produção
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

# Arquivo de vídeo
VIDEO_FILE="/home/lucasmartins/Downloads/videoplayback (1).mp4"

if [ ! -f "$VIDEO_FILE" ]; then
    echo "❌ Arquivo de vídeo não encontrado: $VIDEO_FILE"
    exit 1
fi

echo "📹 Arquivo encontrado: $(basename "$VIDEO_FILE")"
echo "📊 Tamanho: $(ls -lh "$VIDEO_FILE" | awk '{print $5}')"

echo ""
echo "🔐 1. Fazendo login..."

# Login para obter token válido
LOGIN_DATA='{
  "email": "lukaswp10@gmail.com",
  "password": "7pguyrxV!"
}'

LOGIN_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

echo "📥 Resposta do login:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extrair token de acesso
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Erro ao obter token de acesso"
    exit 1
fi

echo "✅ Token obtido com sucesso"

echo ""
echo "📤 2. Criando registro de vídeo..."

# Obter informações do arquivo
FILE_SIZE=$(stat -c%s "$VIDEO_FILE")
FILE_NAME=$(basename "$VIDEO_FILE")

METADATA='{
  "fileName": "'$FILE_NAME'",
  "fileSize": '$FILE_SIZE',
  "contentType": "video/mp4",
  "duration": 60
}'

UPLOAD_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/upload-video" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$METADATA")

echo "📥 Resposta do upload de metadados:"
echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Extrair dados necessários
VIDEO_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.video_id // empty' 2>/dev/null)
UPLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.upload_url // empty' 2>/dev/null)
UPLOAD_PARAMS=$(echo "$UPLOAD_RESPONSE" | jq -c '.upload_params // empty' 2>/dev/null)

if [ -z "$VIDEO_ID" ] || [ -z "$UPLOAD_URL" ] || [ -z "$UPLOAD_PARAMS" ]; then
    echo "❌ Erro ao obter dados de upload"
    exit 1
fi

echo "✅ Video ID: $VIDEO_ID"

echo ""
echo "☁️ 3. Fazendo upload REAL para o Cloudinary..."

# Extrair parâmetros individuais do JSON
PUBLIC_ID=$(echo "$UPLOAD_PARAMS" | jq -r '.public_id')
TIMESTAMP=$(echo "$UPLOAD_PARAMS" | jq -r '.timestamp')
SIGNATURE=$(echo "$UPLOAD_PARAMS" | jq -r '.signature')
API_KEY=$(echo "$UPLOAD_PARAMS" | jq -r '.api_key')
FOLDER=$(echo "$UPLOAD_PARAMS" | jq -r '.folder')

echo "📋 Parâmetros de upload:"
echo "   Public ID: $PUBLIC_ID"
echo "   API Key: $API_KEY"
echo "   Timestamp: $TIMESTAMP"

# Fazer upload real do arquivo para o Cloudinary
CLOUDINARY_RESPONSE=$(curl -s -X POST \
  "$UPLOAD_URL" \
  -F "file=@$VIDEO_FILE" \
  -F "public_id=$PUBLIC_ID" \
  -F "folder=$FOLDER" \
  -F "resource_type=video" \
  -F "type=upload" \
  -F "timestamp=$TIMESTAMP" \
  -F "signature=$SIGNATURE" \
  -F "api_key=$API_KEY")

echo "📥 Resposta do Cloudinary:"
echo "$CLOUDINARY_RESPONSE" | jq '.' 2>/dev/null || echo "$CLOUDINARY_RESPONSE"

# Extrair URL do vídeo
CLOUDINARY_URL=$(echo "$CLOUDINARY_RESPONSE" | jq -r '.secure_url // empty' 2>/dev/null)

if [ -z "$CLOUDINARY_URL" ]; then
    echo "❌ Erro no upload para o Cloudinary"
    exit 1
fi

echo "✅ Upload concluído!"
echo "🔗 URL do vídeo: $CLOUDINARY_URL"

echo ""
echo "🎯 4. Testando transcrição com API REAL..."

TRANSCRIBE_DATA='{
  "video_id": "'$VIDEO_ID'",
  "cloudinary_url": "'$CLOUDINARY_URL'"
}'

echo "📤 Chamando função de transcrição..."

TRANSCRIBE_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/transcribe-video" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TRANSCRIBE_DATA")

echo "📥 Resposta da transcrição:"
echo "$TRANSCRIBE_RESPONSE" | jq '.' 2>/dev/null || echo "$TRANSCRIBE_RESPONSE"

# Extrair transcrição
TRANSCRIPT=$(echo "$TRANSCRIBE_RESPONSE" | jq -r '.transcript // empty' 2>/dev/null)

if [ -z "$TRANSCRIPT" ]; then
    echo "⚠️ Transcrição não obtida, usando texto padrão"
    TRANSCRIPT="Conteúdo de vídeo interessante com potencial viral para redes sociais"
fi

echo ""
echo "🧠 5. Testando análise de conteúdo..."

ANALYZE_DATA='{
  "video_id": "'$VIDEO_ID'",
  "transcript": "'$TRANSCRIPT'"
}'

ANALYZE_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/analyze-content" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$ANALYZE_DATA")

echo "📥 Resposta da análise:"
echo "$ANALYZE_RESPONSE" | jq '.' 2>/dev/null || echo "$ANALYZE_RESPONSE"

echo ""
echo "✂️ 6. Testando geração de clips com Shotstack REAL..."

GENERATE_DATA='{
  "video_id": "'$VIDEO_ID'",
  "analysis_data": {
    "transcript": "'$TRANSCRIPT'",
    "key_moments": [
      {
        "start_time": 5,
        "end_time": 35,
        "description": "Momento principal do vídeo",
        "confidence": 0.9,
        "topics": ["conteúdo", "viral"]
      },
      {
        "start_time": 20,
        "end_time": 50,
        "description": "Momento de engajamento",
        "confidence": 0.8,
        "topics": ["social media", "engagement"]
      }
    ],
    "sentiment": "positive",
    "engagement_score": 0.85
  },
  "preferences": {
    "platforms": ["tiktok", "instagram"],
    "max_clips": 2,
    "min_duration": 15,
    "max_duration": 45
  }
}'

echo "📤 Gerando clips com Shotstack..."

CLIPS_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/generate-clips" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$GENERATE_DATA")

echo "📥 Resposta da geração de clips:"
echo "$CLIPS_RESPONSE" | jq '.' 2>/dev/null || echo "$CLIPS_RESPONSE"

echo ""
echo "📊 7. Resumo do teste COMPLETO:"
echo "   Video ID: $VIDEO_ID"
echo "   Arquivo: $(basename "$VIDEO_FILE")"
echo "   Tamanho: $(ls -lh "$VIDEO_FILE" | awk '{print $5}')"
echo "   URL Cloudinary: $CLOUDINARY_URL"

# Verificar sucesso de cada etapa
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "   ✅ Login: OK"
else
    echo "   ❌ Login: ERRO"
fi

if echo "$UPLOAD_RESPONSE" | grep -q "success"; then
    echo "   ✅ Upload Metadados: OK"
else
    echo "   ❌ Upload Metadados: ERRO"
fi

if echo "$CLOUDINARY_RESPONSE" | grep -q "secure_url"; then
    echo "   ✅ Upload Cloudinary: OK"
else
    echo "   ❌ Upload Cloudinary: ERRO"
fi

if echo "$TRANSCRIBE_RESPONSE" | grep -q "success\|transcript"; then
    echo "   ✅ Transcrição: OK"
else
    echo "   ⚠️ Transcrição: Limitada"
fi

if echo "$ANALYZE_RESPONSE" | grep -q "success\|analysis"; then
    echo "   ✅ Análise: OK"
else
    echo "   ⚠️ Análise: Limitada"
fi

if echo "$CLIPS_RESPONSE" | grep -q "success"; then
    echo "   ✅ Geração de Clips: OK"
else
    echo "   ❌ Geração de Clips: ERRO"
fi

# Verificar se Shotstack foi usado
if echo "$CLIPS_RESPONSE" | grep -q '"using_shotstack": true'; then
    echo "   🎬 Shotstack: ATIVO"
else
    echo "   🎬 Shotstack: Simulação"
fi

echo ""
echo "🎉 Teste COMPLETO finalizado!" 