#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTgzODUsImV4cCI6MjA2ODI5NDM4NX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"
VIDEO_FILE="test-video.mp4"
VIDEO_ID=""
CLOUDINARY_PUBLIC_ID=""

# Função para mostrar progresso
show_progress() {
    local current=$1
    local total=$2
    local step_name=$3
    local width=50
    local percentage=$((current * 100 / total))
    local completed=$((width * current / total))
    local remaining=$((width - completed))
    
    printf "\r${CYAN}[${step_name}]${NC} ["
    printf "%${completed}s" | tr ' ' '#'
    printf "%${remaining}s" | tr ' ' '-'
    printf "] ${percentage}%%"
    
    if [ $current -eq $total ]; then
        echo ""
    fi
}

# Função para log
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[${timestamp}] INFO:${NC} ${message}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] SUCCESS:${NC} ${message}"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] ERROR:${NC} ${message}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[${timestamp}] WARNING:${NC} ${message}"
            ;;
        "STEP")
            echo -e "${PURPLE}[${timestamp}] STEP:${NC} ${message}"
            ;;
    esac
}

# Função para verificar se o arquivo existe
check_file() {
    if [ ! -f "$VIDEO_FILE" ]; then
        log "ERROR" "Arquivo de vídeo não encontrado: $VIDEO_FILE"
        exit 1
    fi
}

# Função para testar conexão
test_connection() {
    log "INFO" "Testando conexão com Supabase..."
    local response=$(curl -s -o /dev/null -w "%{http_code}" "${SUPABASE_URL}/rest/v1/")
    if [ "$response" = "200" ]; then
        log "SUCCESS" "Conexão com Supabase OK"
    else
        log "ERROR" "Falha na conexão com Supabase (HTTP $response)"
        exit 1
    fi
}

# Função para upload
upload_video() {
    log "STEP" "=== ETAPA 1: UPLOAD DO VÍDEO ==="
    show_progress 0 4 "Upload"
    
    log "INFO" "Iniciando upload do vídeo..."
    local response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/upload-video" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"video_file\": \"$VIDEO_FILE\"}")
    
    show_progress 1 4 "Upload"
    
    # Parse response
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        VIDEO_ID=$(echo "$response" | jq -r '.video_id')
        CLOUDINARY_PUBLIC_ID=$(echo "$response" | jq -r '.cloudinary_public_id')
        log "SUCCESS" "Upload concluído - Video ID: $VIDEO_ID"
        log "INFO" "Cloudinary Public ID: $CLOUDINARY_PUBLIC_ID"
        show_progress 4 4 "Upload"
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log "ERROR" "Falha no upload: $error"
        log "ERROR" "Response completa: $response"
        exit 1
    fi
}

# Função para transcrição
transcribe_video() {
    log "STEP" "=== ETAPA 2: TRANSCRIÇÃO ==="
    show_progress 0 4 "Transcrição"
    
    log "INFO" "Iniciando transcrição..."
    local response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/transcribe-video" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"video_id\": \"$VIDEO_ID\"}")
    
    show_progress 2 4 "Transcrição"
    
    # Parse response
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        local transcript=$(echo "$response" | jq -r '.transcript // "N/A"')
        local duration=$(echo "$response" | jq -r '.duration // "N/A"')
        log "SUCCESS" "Transcrição concluída"
        log "INFO" "Duração: ${duration}s"
        log "INFO" "Transcrição: ${transcript:0:100}..."
        show_progress 4 4 "Transcrição"
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log "ERROR" "Falha na transcrição: $error"
        log "ERROR" "Response completa: $response"
        exit 1
    fi
}

# Função para análise
analyze_content() {
    log "STEP" "=== ETAPA 3: ANÁLISE DE CONTEÚDO ==="
    show_progress 0 4 "Análise"
    
    log "INFO" "Iniciando análise de conteúdo..."
    local response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/analyze-content" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"video_id\": \"$VIDEO_ID\"}")
    
    show_progress 2 4 "Análise"
    
    # Parse response
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        local clip_count=$(echo "$response" | jq -r '.clip_suggestions | length // 0')
        local content_type=$(echo "$response" | jq -r '.content_type // "N/A"')
        log "SUCCESS" "Análise concluída"
        log "INFO" "Sugestões de clips: $clip_count"
        log "INFO" "Tipo de conteúdo: $content_type"
        show_progress 4 4 "Análise"
        
        # Salvar sugestões para próxima etapa
        echo "$response" > "clip_suggestions.json"
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log "ERROR" "Falha na análise: $error"
        log "ERROR" "Response completa: $response"
        exit 1
    fi
}

# Função para geração de clips
generate_clips() {
    log "STEP" "=== ETAPA 4: GERAÇÃO DE CLIPS ==="
    show_progress 0 4 "Clips"
    
    log "INFO" "Iniciando geração de clips..."
    
    # Ler sugestões do arquivo
    if [ ! -f "clip_suggestions.json" ]; then
        log "ERROR" "Arquivo de sugestões não encontrado"
        exit 1
    fi
    
    local clip_suggestions=$(cat "clip_suggestions.json" | jq -c '.clip_suggestions')
    
    local response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/generate-clips" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"video_id\": \"$VIDEO_ID\",
            \"clip_suggestions\": $clip_suggestions,
            \"cloudinary_public_id\": \"$CLOUDINARY_PUBLIC_ID\"
        }")
    
    show_progress 2 4 "Clips"
    
    # Parse response
    local success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        local clips_created=$(echo "$response" | jq -r '.clips_created // 0')
        local duration=$(echo "$response" | jq -r '.processing_duration_seconds // "N/A"')
        log "SUCCESS" "Geração de clips concluída"
        log "INFO" "Clips criados: $clips_created"
        log "INFO" "Duração do processamento: ${duration}s"
        show_progress 4 4 "Clips"
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log "ERROR" "Falha na geração de clips: $error"
        log "ERROR" "Response completa: $response"
        exit 1
    fi
}

# Função para limpeza
cleanup() {
    log "INFO" "Limpando arquivos temporários..."
    rm -f "clip_suggestions.json"
}

# Função principal
main() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}  PIPELINE DE PROCESSAMENTO     ${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
    
    # Verificações iniciais
    check_file
    test_connection
    
    # Executar pipeline
    upload_video
    transcribe_video
    analyze_content
    generate_clips
    
    # Limpeza
    cleanup
    
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}  PIPELINE CONCLUÍDO!          ${NC}"
    echo -e "${GREEN}================================${NC}"
    log "SUCCESS" "Todas as etapas foram executadas com sucesso!"
    log "INFO" "Video ID final: $VIDEO_ID"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 