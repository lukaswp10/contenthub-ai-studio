#!/bin/bash

# Script de teste completo do fluxo de upload até geração de clips
# Uso: ./scripts/test-upload-flow.sh

set -e  # Parar em caso de erro

# Configurações
VIDEO_FILE="/home/lucasmartins/Downloads/videoplayback (1).mp4"
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NzU3NzMsImV4cCI6MjA1MDE1MTc3M30.NqGBkjQBOKJjKJlGXmQVYiRIVEVLnxdJUGbLJNKMtME"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando teste completo do fluxo de upload...${NC}"

# Verificar se o arquivo existe
if [ ! -f "$VIDEO_FILE" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: $VIDEO_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Arquivo encontrado: $VIDEO_FILE${NC}"

# Obter informações do arquivo
FILE_SIZE=$(stat -c%s "$VIDEO_FILE")
FILE_NAME=$(basename "$VIDEO_FILE")
CONTENT_TYPE="video/mp4"

echo -e "${BLUE}📁 Informações do arquivo:${NC}"
echo -e "   Nome: $FILE_NAME"
echo -e "   Tamanho: $FILE_SIZE bytes ($(($FILE_SIZE / 1024 / 1024)) MB)"
echo -e "   Tipo: $CONTENT_TYPE"

# Função para obter duração do vídeo (usando ffprobe se disponível)
get_video_duration() {
    if command -v ffprobe &> /dev/null; then
        ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VIDEO_FILE" | cut -d. -f1
    else
        echo "75"  # Valor padrão se ffprobe não estiver disponível
    fi
}

DURATION=$(get_video_duration)
echo -e "   Duração: ${DURATION}s"

# Passo 1: Fazer login (simulando um usuário real)
echo -e "\n${YELLOW}🔐 Passo 1: Fazendo login...${NC}"

# Você precisa fornecer credenciais reais aqui
read -p "Email: " USER_EMAIL
read -s -p "Senha: " USER_PASSWORD
echo

LOGIN_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\"
  }")

# Extrair token de acesso
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Erro no login:${NC}"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi

echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
echo -e "   Token: ${ACCESS_TOKEN:0:20}..."

# Passo 2: Solicitar upload
echo -e "\n${YELLOW}📤 Passo 2: Solicitando upload...${NC}"

UPLOAD_REQUEST=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/upload-video" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"fileName\": \"$FILE_NAME\",
    \"fileSize\": $FILE_SIZE,
    \"contentType\": \"$CONTENT_TYPE\",
    \"duration\": $DURATION
  }")

echo -e "${BLUE}📋 Resposta do upload-video:${NC}"
echo "$UPLOAD_REQUEST" | jq .

# Verificar se foi bem-sucedido
SUCCESS=$(echo "$UPLOAD_REQUEST" | jq -r '.success // false')
if [ "$SUCCESS" != "true" ]; then
    echo -e "${RED}❌ Erro na solicitação de upload:${NC}"
    echo "$UPLOAD_REQUEST" | jq .
    exit 1
fi

# Extrair dados necessários
VIDEO_ID=$(echo "$UPLOAD_REQUEST" | jq -r '.video_id')
UPLOAD_URL=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_url')
PUBLIC_ID=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params.public_id')

echo -e "${GREEN}✅ Upload autorizado${NC}"
echo -e "   Video ID: $VIDEO_ID"
echo -e "   Upload URL: $UPLOAD_URL"
echo -e "   Public ID: ${PUBLIC_ID:0:50}..."

# Passo 3: Upload para Cloudinary
echo -e "\n${YELLOW}☁️  Passo 3: Fazendo upload para Cloudinary...${NC}"

# Extrair todos os parâmetros de upload
UPLOAD_PARAMS=$(echo "$UPLOAD_REQUEST" | jq -r '.upload_params')

# Criar arquivo temporário com os parâmetros
TEMP_PARAMS=$(mktemp)
echo "$UPLOAD_PARAMS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' > "$TEMP_PARAMS"

# Fazer upload usando curl
CLOUDINARY_RESPONSE=$(curl -s -X POST \
  "$UPLOAD_URL" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^public_id=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^folder=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^resource_type=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^type=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^timestamp=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^video_codec=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^audio_codec=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^context=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^upload_preset=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^signature=' | cut -d'=' -f2-)" \
  --form-string "$(cat "$TEMP_PARAMS" | grep '^api_key=' | cut -d'=' -f2-)" \
  -F "file=@$VIDEO_FILE")

# Limpar arquivo temporário
rm "$TEMP_PARAMS"

echo -e "${BLUE}📋 Resposta do Cloudinary:${NC}"
echo "$CLOUDINARY_RESPONSE" | jq .

# Verificar se upload foi bem-sucedido
SECURE_URL=$(echo "$CLOUDINARY_RESPONSE" | jq -r '.secure_url // empty')
if [ -z "$SECURE_URL" ] || [ "$SECURE_URL" = "null" ]; then
    echo -e "${RED}❌ Erro no upload para Cloudinary:${NC}"
    echo "$CLOUDINARY_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Upload para Cloudinary concluído${NC}"
echo -e "   Secure URL: ${SECURE_URL:0:60}..."

# Passo 4: Atualizar registro do vídeo
echo -e "\n${YELLOW}💾 Passo 4: Atualizando registro do vídeo...${NC}"

UPDATE_RESPONSE=$(curl -s -X PATCH \
  "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"cloudinary_public_id\": \"$PUBLIC_ID\",
    \"cloudinary_secure_url\": \"$SECURE_URL\",
    \"processing_status\": \"queued\"
  }")

echo -e "${GREEN}✅ Registro do vídeo atualizado${NC}"

# Passo 5: Iniciar transcrição
echo -e "\n${YELLOW}📝 Passo 5: Iniciando transcrição...${NC}"

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

echo -e "${BLUE}📋 Resposta da transcrição:${NC}"
echo "$TRANSCRIBE_RESPONSE" | jq .

# Passo 6: Monitorar progresso
echo -e "\n${YELLOW}⏳ Passo 6: Monitorando progresso...${NC}"

monitor_progress() {
    local max_attempts=60  # 5 minutos (5s * 60)
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -e "${BLUE}🔍 Verificação $attempt/$max_attempts...${NC}"
        
        VIDEO_STATUS=$(curl -s -X GET \
          "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID&select=id,processing_status,error_message" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -H "apikey: $SUPABASE_ANON_KEY")
        
        STATUS=$(echo "$VIDEO_STATUS" | jq -r '.[0].processing_status // "unknown"')
        ERROR_MSG=$(echo "$VIDEO_STATUS" | jq -r '.[0].error_message // empty')
        
        echo -e "   Status atual: $STATUS"
        
        case $STATUS in
            "ready")
                echo -e "${GREEN}🎉 Processamento concluído!${NC}"
                return 0
                ;;
            "failed")
                echo -e "${RED}❌ Processamento falhou:${NC}"
                echo -e "   Erro: $ERROR_MSG"
                return 1
                ;;
            "transcribing"|"analyzing"|"generating_clips")
                echo -e "${YELLOW}   Processando... ($STATUS)${NC}"
                ;;
            *)
                echo -e "${YELLOW}   Status: $STATUS${NC}"
                ;;
        esac
        
        sleep 5
        ((attempt++))
    done
    
    echo -e "${RED}⏰ Timeout: Processamento demorou mais que 5 minutos${NC}"
    return 1
}

if monitor_progress; then
    # Passo 7: Verificar clips gerados
    echo -e "\n${YELLOW}🎬 Passo 7: Verificando clips gerados...${NC}"
    
    CLIPS_RESPONSE=$(curl -s -X GET \
      "$SUPABASE_URL/rest/v1/clips?video_id=eq.$VIDEO_ID&select=*" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "apikey: $SUPABASE_ANON_KEY")
    
    echo -e "${BLUE}📋 Clips gerados:${NC}"
    echo "$CLIPS_RESPONSE" | jq .
    
    CLIPS_COUNT=$(echo "$CLIPS_RESPONSE" | jq '. | length')
    echo -e "${GREEN}✅ Total de clips gerados: $CLIPS_COUNT${NC}"
    
    # Mostrar detalhes de cada clip
    if [ "$CLIPS_COUNT" -gt 0 ]; then
        echo -e "\n${BLUE}🎥 Detalhes dos clips:${NC}"
        echo "$CLIPS_RESPONSE" | jq -r '.[] | "  • \(.title) (\(.duration_seconds)s) - Score: \(.viral_score // "N/A")"'
    fi
    
    # Passo 8: Verificar análise de conteúdo
    echo -e "\n${YELLOW}📊 Passo 8: Verificando análise de conteúdo...${NC}"
    
    ANALYSIS_RESPONSE=$(curl -s -X GET \
      "$SUPABASE_URL/rest/v1/content_analysis?video_id=eq.$VIDEO_ID&select=*" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "apikey: $SUPABASE_ANON_KEY")
    
    echo -e "${BLUE}📋 Análise de conteúdo:${NC}"
    echo "$ANALYSIS_RESPONSE" | jq .
    
    echo -e "\n${GREEN}🎉 TESTE COMPLETO FINALIZADO COM SUCESSO! 🎉${NC}"
    echo -e "${BLUE}📋 Resumo:${NC}"
    echo -e "   Video ID: $VIDEO_ID"
    echo -e "   Clips gerados: $CLIPS_COUNT"
    echo -e "   Status final: ready"
    echo -e "   URL do vídeo: ${SECURE_URL:0:60}..."
else
    echo -e "\n${RED}❌ TESTE FALHOU NO PROCESSAMENTO${NC}"
    exit 1
fi 