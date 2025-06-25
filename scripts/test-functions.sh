#!/bin/bash

# 🎬 ClipsForge - Test Functions Script
# Script para testar individualmente cada função edge

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configurações - CONFIGURE ESTAS VARIÁVEIS
SUPABASE_URL="https://supabase.com/dashboard/project/rgwbtdzdeibobuveegfp"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2NzM0MiwiZXhwIjoyMDY1NjQzMzQyfQ.BOtYYpC6Wzdl4Naz5901w2ZlfhDEi0TbIkRpKscrOlw"

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Função para testar edge functions
test_function() {
    local function_name=$1
    local data=$2
    local description=$3
    
    echo -e "\n${PURPLE}🧪 Testando: $function_name${NC}"
    echo -e "${BLUE}📝 $description${NC}"
    
    echo -e "\n${YELLOW}📦 Payload:${NC}"
    echo "$data" | jq .
    
    echo -e "\n${BLUE}📡 Fazendo request...${NC}"
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SUPABASE_URL/functions/v1/$function_name" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -d "$data")
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    echo -e "${BLUE}📥 Status: $status${NC}"
    
    if [ "$status" -ge 400 ]; then
        error "❌ Função falhou"
        echo -e "${RED}💥 Response:${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    else
        log "✅ Função executada com sucesso"
        echo -e "${GREEN}📄 Response:${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 0
    fi
}

# 1. Testar upload-video
test_upload_video() {
    local data='{
        "fileName": "test-video.mp4",
        "fileSize": 1024000,
        "contentType": "video/mp4",
        "userId": "test-user-id"
    }'
    
    test_function "upload-video" "$data" "Preparar upload de vídeo"
}

# 2. Testar transcribe-video
test_transcribe_video() {
    local data='{
        "video_id": "test-video-id",
        "file_path": "videos/test-video.mp4"
    }'
    
    test_function "transcribe-video" "$data" "Transcrever vídeo usando IA"
}

# 3. Testar analyze-content
test_analyze_content() {
    local data='{
        "video_id": "test-video-id",
        "transcript": "Este é um vídeo de teste sobre tecnologia e inovação. Vamos falar sobre inteligência artificial e como ela está transformando o mundo."
    }'
    
    test_function "analyze-content" "$data" "Analisar conteúdo do vídeo"
}

# 4. Testar generate-clips
test_generate_clips() {
    local data='{
        "video_id": "test-video-id",
        "transcript": "Este é um vídeo de teste sobre tecnologia e inovação. Vamos falar sobre inteligência artificial e como ela está transformando o mundo. A IA está revolucionando diversos setores.",
        "duration": 120,
        "max_clips": 3,
        "min_duration": 15,
        "max_duration": 60,
        "platforms": ["instagram", "tiktok", "youtube"]
    }'
    
    test_function "generate-clips" "$data" "Gerar clips do vídeo"
}

# 5. Testar generate-reels
test_generate_reels() {
    local data='{
        "video_id": "test-video-id",
        "clips": [
            {
                "id": "clip-1",
                "start_time": 10,
                "end_time": 25,
                "title": "IA Revolucionária",
                "description": "Como a IA está mudando tudo"
            }
        ]
    }'
    
    test_function "generate-reels" "$data" "Gerar reels a partir dos clips"
}

# 6. Testar schedule-post
test_schedule_post() {
    local data='{
        "clip_id": "test-clip-id",
        "platforms": ["instagram", "tiktok"],
        "scheduled_time": "2024-01-01T12:00:00Z",
        "caption": "Confira este clip incrível! #IA #Tecnologia",
        "user_id": "test-user-id"
    }'
    
    test_function "schedule-post" "$data" "Agendar publicação de clip"
}

# 7. Testar connect-social-account
test_connect_social_account() {
    local data='{
        "platform": "instagram",
        "auth_code": "test-auth-code",
        "user_id": "test-user-id"
    }'
    
    test_function "connect-social-account" "$data" "Conectar conta social"
}

# 8. Testar refresh-social-account
test_refresh_social_account() {
    local data='{
        "account_id": "test-account-id",
        "platform": "instagram"
    }'
    
    test_function "refresh-social-account" "$data" "Atualizar token da conta social"
}

# 9. Testar complete-oauth
test_complete_oauth() {
    local data='{
        "code": "test-oauth-code",
        "state": "test-state",
        "platform": "google"
    }'
    
    test_function "complete-oauth" "$data" "Completar OAuth"
}

# 10. Testar create-checkout
test_create_checkout() {
    local data='{
        "plan": "pro",
        "user_id": "test-user-id",
        "success_url": "https://clipsforge.com/success",
        "cancel_url": "https://clipsforge.com/cancel"
    }'
    
    test_function "create-checkout" "$data" "Criar checkout de pagamento"
}

# 11. Testar customer-portal
test_customer_portal() {
    local data='{
        "customer_id": "test-customer-id",
        "return_url": "https://clipsforge.com/dashboard"
    }'
    
    test_function "customer-portal" "$data" "Acessar portal do cliente"
}

# 12. Testar check-subscription
test_check_subscription() {
    local data='{
        "user_id": "test-user-id"
    }'
    
    test_function "check-subscription" "$data" "Verificar status da assinatura"
}

# Menu interativo
show_menu() {
    echo -e "\n${PURPLE}🎬 ClipsForge - Test Functions Menu${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${GREEN}1.${NC}  upload-video"
    echo -e "${GREEN}2.${NC}  transcribe-video"
    echo -e "${GREEN}3.${NC}  analyze-content"
    echo -e "${GREEN}4.${NC}  generate-clips"
    echo -e "${GREEN}5.${NC}  generate-reels"
    echo -e "${GREEN}6.${NC}  schedule-post"
    echo -e "${GREEN}7.${NC}  connect-social-account"
    echo -e "${GREEN}8.${NC}  refresh-social-account"
    echo -e "${GREEN}9.${NC}  complete-oauth"
    echo -e "${GREEN}10.${NC} create-checkout"
    echo -e "${GREEN}11.${NC} customer-portal"
    echo -e "${GREEN}12.${NC} check-subscription"
    echo -e "${GREEN}13.${NC} 🚀 Testar TODAS as funções"
    echo -e "${GREEN}0.${NC}  Sair"
    echo -e "\n${YELLOW}Escolha uma opção:${NC} "
}

# Função principal
main() {
    # Verificar dependências
    if ! command -v curl &> /dev/null; then
        error "curl não está instalado"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        error "jq não está instalado"
        exit 1
    fi
    
    # Verificar configurações
    if [ "$SUPABASE_URL" = "https://your-project.supabase.co" ]; then
        error "Configure SUPABASE_URL no script"
        exit 1
    fi
    
    if [ "$SUPABASE_SERVICE_KEY" = "your-service-key" ]; then
        error "Configure SUPABASE_SERVICE_KEY no script"
        exit 1
    fi
    
    # Menu interativo
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1) test_upload_video ;;
            2) test_transcribe_video ;;
            3) test_analyze_content ;;
            4) test_generate_clips ;;
            5) test_generate_reels ;;
            6) test_schedule_post ;;
            7) test_connect_social_account ;;
            8) test_refresh_social_account ;;
            9) test_complete_oauth ;;
            10) test_create_checkout ;;
            11) test_customer_portal ;;
            12) test_check_subscription ;;
            13)
                log "🚀 Testando todas as funções..."
                test_upload_video
                test_transcribe_video
                test_analyze_content
                test_generate_clips
                test_generate_reels
                test_schedule_post
                test_connect_social_account
                test_refresh_social_account
                test_complete_oauth
                test_create_checkout
                test_customer_portal
                test_check_subscription
                log "✅ Todos os testes concluídos!"
                ;;
            0)
                log "👋 Saindo..."
                exit 0
                ;;
            *)
                error "Opção inválida"
                ;;
        esac
        
        echo -e "\n${YELLOW}Pressione Enter para continuar...${NC}"
        read -r
    done
}

# Executar se chamado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi