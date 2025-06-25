#!/bin/bash

# Script de teste simplificado do fluxo de upload
# Uso: ./scripts/test-upload-simple.sh

set -e

# Configurações
VIDEO_FILE="/home/lucasmartins/Downloads/videoplayback (1).mp4"
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

# Credenciais (ajuste conforme necessário)
USER_EMAIL="lukaswp10@gmail.com"
USER_PASSWORD="sua_senha_aqui"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Iniciando teste de upload...${NC}"

# Verificar dependências
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq não encontrado. Instale com: sudo apt install jq${NC}"
    exit 1
fi

if [ ! -f "$VIDEO_FILE" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: $VIDEO_FILE${NC}"
    exit 1
fi

# Informações do arquivo
FILE_SIZE=$(stat -c%s "$VIDEO_FILE")
FILE_NAME=$(basename "$VIDEO_FILE")
echo -e "${GREEN}✅ Arquivo: $FILE_NAME ($(($FILE_SIZE / 1024 / 1024)) MB)${NC}"

# Passo 1: Login
echo -e "\n${YELLOW}🔐 Fazendo login...${NC}"
read -s -p "Digite sua senha: " USER_PASSWORD
echo

LOGIN_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\"
  }")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Erro no login${NC}"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi

echo -e "${GREEN}✅ Login OK${NC}"

# Passo 2: Solicitar upload
echo -e "\n${YELLOW}📤 Solicitando upload...${NC}"

UPLOAD_REQUEST=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/upload-video" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"fileName\": \"$FILE_NAME\",
    \"fileSize\": $FILE_SIZE,
    \"contentType\": \"video/mp4\",
    \"duration\": 75
  }")

echo -e "${BLUE}Resposta:${NC}"
echo "$UPLOAD_REQUEST" | jq .

SUCCESS=$(echo "$UPLOAD_REQUEST" | jq -r '.success // false')
if [ "$SUCCESS" != "true" ]; then
    echo -e "${RED}❌ Erro na solicitação${NC}"
    exit 1
fi

VIDEO_ID=$(echo "$UPLOAD_REQUEST" | jq -r '.video_id')
UPLOAD_URL=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_url')

echo -e "${GREEN}✅ Upload autorizado - Video ID: $VIDEO_ID${NC}"

# Passo 3: Upload para Cloudinary
echo -e "\n${YELLOW}☁️ Fazendo upload para Cloudinary...${NC}"

# Extrair parâmetros
PUBLIC_ID=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params.public_id')
FOLDER=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params.folder')
TIMESTAMP=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params.timestamp')
SIGNATURE=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params.signature')
API_KEY=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params.api_key')
CONTEXT=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params.context')
UPLOAD_PRESET=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params.upload_preset')

echo -e "${BLUE}Parâmetros de upload:${NC}"
echo -e "  Public ID: ${PUBLIC_ID:0:50}..."
echo -e "  Folder: $FOLDER"
echo -e "  Timestamp: $TIMESTAMP"
echo -e "  API Key: $API_KEY"

# Upload para Cloudinary
CLOUDINARY_RESPONSE=$(curl -s -X POST "$UPLOAD_URL" \
  -F "public_id=$PUBLIC_ID" \
  -F "folder=$FOLDER" \
  -F "resource_type=video" \
  -F "type=upload" \
  -F "timestamp=$TIMESTAMP" \
  -F "video_codec=auto" \
  -F "audio_codec=auto" \
  -F "context=$CONTEXT" \
  -F "upload_preset=$UPLOAD_PRESET" \
  -F "signature=$SIGNATURE" \
  -F "api_key=$API_KEY" \
  -F "file=@$VIDEO_FILE")

echo -e "${BLUE}Resposta do Cloudinary:${NC}"
echo "$CLOUDINARY_RESPONSE" | jq .

SECURE_URL=$(echo "$CLOUDINARY_RESPONSE" | jq -r '.secure_url // empty')
if [ -z "$SECURE_URL" ] || [ "$SECURE_URL" = "null" ]; then
    echo -e "${RED}❌ Erro no upload para Cloudinary${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Upload para Cloudinary OK${NC}"

# Passo 4: Atualizar registro
echo -e "\n${YELLOW}💾 Atualizando registro...${NC}"

curl -s -X PATCH \
  "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"cloudinary_public_id\": \"$PUBLIC_ID\",
    \"cloudinary_secure_url\": \"$SECURE_URL\",
    \"processing_status\": \"queued\"
  }"

echo -e "${GREEN}✅ Registro atualizado${NC}"

# Passo 5: Iniciar transcrição
echo -e "\n${YELLOW}📝 Iniciando transcrição...${NC}"

TRANSCRIBE_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/transcribe-video" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"$VIDEO_ID\",
    \"cloudinary_url\": \"$SECURE_URL\",
    \"cloudinary_public_id\": \"$PUBLIC_ID\"
  }")

echo -e "${BLUE}Resposta da transcrição:${NC}"
echo "$TRANSCRIBE_RESPONSE" | jq .

# Passo 6: Monitorar por 2 minutos
echo -e "\n${YELLOW}⏳ Monitorando progresso (2 min)...${NC}"

for i in {1..24}; do
    echo -e "${BLUE}Verificação $i/24...${NC}"
    
    VIDEO_STATUS=$(curl -s -X GET \
      "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID&select=processing_status,error_message" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "apikey: $SUPABASE_ANON_KEY")
    
    STATUS=$(echo "$VIDEO_STATUS" | jq -r '.[0].processing_status // "unknown"')
    echo -e "  Status: $STATUS"
    
    if [ "$STATUS" = "ready" ]; then
        echo -e "${GREEN}🎉 Processamento concluído!${NC}"
        break
    elif [ "$STATUS" = "failed" ]; then
        ERROR_MSG=$(echo "$VIDEO_STATUS" | jq -r '.[0].error_message // "Erro desconhecido"')
        echo -e "${RED}❌ Falhou: $ERROR_MSG${NC}"
        exit 1
    fi
    
    sleep 5
done

# Verificar clips
echo -e "\n${YELLOW}🎬 Verificando clips...${NC}"

CLIPS_RESPONSE=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/clips?video_id=eq.$VIDEO_ID&select=*" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY")

echo -e "${BLUE}Clips gerados:${NC}"
echo "$CLIPS_RESPONSE" | jq .

CLIPS_COUNT=$(echo "$CLIPS_RESPONSE" | jq '. | length')
echo -e "${GREEN}✅ Total de clips: $CLIPS_COUNT${NC}"

if [ "$CLIPS_COUNT" -gt 0 ]; then
    echo -e "\n${BLUE}Detalhes dos clips:${NC}"
    echo "$CLIPS_RESPONSE" | jq -r '.[] | "• \(.title) (\(.duration_seconds)s) - Score: \(.viral_score // "N/A")"'
fi

echo -e "\n${GREEN}🎉 TESTE CONCLUÍDO!${NC}"
echo -e "Video ID: $VIDEO_ID"
echo -e "Clips: $CLIPS_COUNT"
echo -e "URL: ${SECURE_URL:0:60}..." 