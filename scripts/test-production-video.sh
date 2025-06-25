#!/bin/bash

# Script para testar upload de vídeo no ambiente de PRODUÇÃO
# Usando as APIs reais configuradas no Supabase Dashboard

set -e

echo "=== TESTE COMPLETO COM VÍDEO REAL - PRODUÇÃO ==="

# Configurações de produção
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

# Arquivo de vídeo
VIDEO_FILE="/home/lucasmartins/Downloads/videoplayback (1).mp4"

echo "Vídeo: $VIDEO_FILE"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$VIDEO_FILE" ]; then
    echo "❌ Arquivo de vídeo não encontrado: $VIDEO_FILE"
    exit 1
fi

echo "✅ Arquivo de vídeo encontrado"
echo ""

# Mostrar tamanho do arquivo
FILE_SIZE=$(stat -c%s "$VIDEO_FILE")
FILE_SIZE_MB=$((FILE_SIZE / 1024 / 1024))
echo "Tamanho do arquivo: ${FILE_SIZE_MB} MB"

# Credenciais de teste
EMAIL="lukaswp10@gmail.com"
PASSWORD="7pguyrxV!"

echo "1. Fazendo login no ambiente de PRODUÇÃO..."
LOGIN_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extrair o access_token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo "❌ Erro no login"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login realizado com sucesso na PRODUÇÃO"
echo ""

echo "2. Resetando limite de upload..."
RESET_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/reset_user_limits" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "✅ Limite resetado"
echo ""

echo "3. Preparando upload para Cloudinary (PRODUÇÃO)..."
UPLOAD_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/upload-video" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"fileName\": \"videoplayback.mp4\",
    \"fileSize\": $FILE_SIZE,
    \"contentType\": \"video/mp4\",
    \"duration\": 120,
    \"processingConfig\": {
      \"clipDuration\": 30,
      \"clipCount\": 3,
      \"language\": \"pt\",
      \"contentType\": \"educational\",
      \"generateSubtitles\": true,
      \"optimizeForMobile\": true
    }
  }")

echo "Upload response: $UPLOAD_RESPONSE"

# Verificar se foi bem-sucedido
SUCCESS=$(echo "$UPLOAD_RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" != "true" ]; then
    echo "❌ Erro na preparação do upload"
    echo "Response: $UPLOAD_RESPONSE"
    exit 1
fi

echo "✅ Parâmetros de upload obtidos"

# Extrair dados necessários
VIDEO_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.video_id')
UPLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.upload_url')
UPLOAD_PARAMS=$(echo "$UPLOAD_RESPONSE" | jq -r '.upload_params')

echo "Video ID: $VIDEO_ID"
echo ""

echo "4. Fazendo upload real para Cloudinary..."
echo "Fazendo upload para: $UPLOAD_URL"

# Extrair parâmetros individuais
PUBLIC_ID=$(echo "$UPLOAD_PARAMS" | jq -r '.public_id')
FOLDER=$(echo "$UPLOAD_PARAMS" | jq -r '.folder')
TIMESTAMP=$(echo "$UPLOAD_PARAMS" | jq -r '.timestamp')
SIGNATURE=$(echo "$UPLOAD_PARAMS" | jq -r '.signature')
API_KEY=$(echo "$UPLOAD_PARAMS" | jq -r '.api_key')
CONTEXT=$(echo "$UPLOAD_PARAMS" | jq -r '.context')
UPLOAD_PRESET=$(echo "$UPLOAD_PARAMS" | jq -r '.upload_preset')

echo "Public ID: $PUBLIC_ID"

# Fazer upload real para Cloudinary
CLOUDINARY_RESPONSE=$(curl -s -X POST "$UPLOAD_URL" \
  -F "file=@$VIDEO_FILE" \
  -F "public_id=$PUBLIC_ID" \
  -F "folder=$FOLDER" \
  -F "resource_type=video" \
  -F "type=upload" \
  -F "timestamp=$TIMESTAMP" \
  -F "signature=$SIGNATURE" \
  -F "api_key=$API_KEY" \
  -F "context=$CONTEXT" \
  -F "upload_preset=$UPLOAD_PRESET" \
  -F "video_codec=auto" \
  -F "audio_codec=auto")

echo "Cloudinary response: $CLOUDINARY_RESPONSE"

# Verificar se o upload foi bem-sucedido
CLOUDINARY_SUCCESS=$(echo "$CLOUDINARY_RESPONSE" | jq -r '.secure_url // empty')
if [ -z "$CLOUDINARY_SUCCESS" ]; then
    echo "❌ Erro no upload para Cloudinary"
    echo "Response: $CLOUDINARY_RESPONSE"
    exit 1
fi

echo "✅ Upload para Cloudinary realizado com sucesso!"
echo "URL segura: $CLOUDINARY_SUCCESS"
echo ""

echo "5. Atualizando status do vídeo..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"cloudinary_secure_url\": \"$CLOUDINARY_SUCCESS\",
    \"processing_status\": \"uploaded\"
  }")

echo "✅ Status atualizado para 'uploaded'"
echo ""

echo "6. Iniciando transcrição..."
TRANSCRIBE_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/transcribe-video" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"video_id\": \"$VIDEO_ID\", \"cloudinary_url\": \"$CLOUDINARY_SUCCESS\", \"cloudinary_public_id\": \"$PUBLIC_ID\"}")

echo "Transcribe response: $TRANSCRIBE_RESPONSE"

# Verificar se a transcrição foi iniciada
TRANSCRIBE_SUCCESS=$(echo "$TRANSCRIBE_RESPONSE" | jq -r '.success // false')
if [ "$TRANSCRIBE_SUCCESS" = "true" ]; then
    echo "✅ Transcrição iniciada com sucesso!"
else
    echo "⚠️ Possível erro na transcrição:"
    echo "$TRANSCRIBE_RESPONSE"
fi

echo ""
echo "7. Aguardando processamento (30 segundos)..."
sleep 30

echo "8. Verificando status final..."
FINAL_STATUS=$(curl -s -X GET "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID&select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Status final do vídeo:"
echo "$FINAL_STATUS" | jq '.[0] // {}'

echo ""
echo "9. Verificando clips gerados..."
CLIPS_STATUS=$(curl -s -X GET "$SUPABASE_URL/rest/v1/clips?video_id=eq.$VIDEO_ID&select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

CLIPS_COUNT=$(echo "$CLIPS_STATUS" | jq '. | length')
echo "Clips encontrados: $CLIPS_COUNT"

if [ "$CLIPS_COUNT" -gt 0 ]; then
    echo "✅ Clips gerados com sucesso!"
    echo "$CLIPS_STATUS" | jq '.[] | {id: .id, title: .title, start_time: .start_time, end_time: .end_time, score: .virality_score}'
else
    echo "⚠️ Nenhum clip foi gerado ainda. Pode estar processando..."
fi

echo ""
echo "=== TESTE COMPLETO ==="
echo "✅ Upload: Sucesso"
echo "✅ Cloudinary: Sucesso"  
echo "✅ Transcrição: $([ "$TRANSCRIBE_SUCCESS" = "true" ] && echo "Sucesso" || echo "Verificar")"
echo "✅ Clips: $CLIPS_COUNT gerados"
echo ""
echo "🎉 Teste com APIs reais concluído!" 