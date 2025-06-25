#!/bin/bash

# 🎬 ClipsForge - Debug Flow Script
# Script para debugar todo o fluxo de upload até criação de clips

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Carregar configurações do .env.debug
if [ -f ".env.debug" ]; then
    source .env.debug
else
    echo "❌ Arquivo .env.debug não encontrado!"
    echo "Execute primeiro: ./scripts/setup-debug.sh"
    exit 1
fi

# Configurações locais
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# Variáveis globais
USER_ID=""
ACCESS_TOKEN=""
VIDEO_ID=""
PROCESSING_ID=""

echo -e "${PURPLE}🎬 ClipsForge Debug Flow${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}🚀 Iniciando debug completo do fluxo ClipsForge${NC}"

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

# Função para fazer requests com debug
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local auth_header=${4:-"Bearer $SUPABASE_SERVICE_KEY"}
    
    echo -e "\n${BLUE}📡 Request: $method $url${NC}"
    if [ ! -z "$data" ]; then
        echo -e "${YELLOW}📦 Data: $data${NC}"
    fi
    
    local response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
        -H "Content-Type: application/json" \
        -H "Authorization: $auth_header" \
        -H "apikey: $SUPABASE_SERVICE_KEY" \
        ${data:+-d "$data"})
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    echo -e "${BLUE}📥 Status: $status${NC}"
    echo -e "${BLUE}📄 Response: $body${NC}"
    
    if [ "$status" -ge 400 ]; then
        error "Request failed with status $status"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
    
    echo "$body"
}

# 1. Criar usuário de teste
create_test_user() {
    log "👤 Criando usuário de teste..."
    
    # Inserir diretamente na tabela profiles usando service key
    local user_uuid=$(uuidgen | tr '[:upper:]' '[:lower:]')
    USER_ID=$user_uuid
    
    local profile_data='{
        "id": "'$USER_ID'",
        "email": "debug@clipsforge.com",
        "full_name": "Debug User",
        "subscription_status": "active",
        "subscription_plan": "pro"
    }'
    
    echo -e "\n${BLUE}👤 Criando perfil de usuário...${NC}"
    local profile_response=$(make_request "POST" "$SUPABASE_URL/rest/v1/profiles" "$profile_data")
    
    if [ $? -eq 0 ]; then
        log "✅ Usuário de teste criado com ID: $USER_ID"
    else
        warning "⚠️ Usuário pode já existir, continuando..."
        USER_ID="550e8400-e29b-41d4-a716-446655440000"  # UUID fixo para testes
    fi
}

# 2. Testar upload de vídeo
test_upload() {
    log "📤 Testando upload de vídeo..."
    
    # Criar arquivo de teste (se não existir)
    if [ ! -f "test-video.mp4" ]; then
        warning "Arquivo test-video.mp4 não encontrado. Criando arquivo de teste..."
        echo "fake video content for testing ClipsForge debug flow" > test-video.mp4
    fi
    
    # Registrar vídeo no banco diretamente
    echo -e "\n${BLUE}💾 Registrando vídeo no banco...${NC}"
    local video_uuid=$(uuidgen | tr '[:upper:]' '[:lower:]')
    VIDEO_ID=$video_uuid
    
    local video_data='{
        "id": "'$VIDEO_ID'",
        "user_id": "'$USER_ID'",
        "title": "Vídeo de Teste Debug",
        "description": "Vídeo para testar o fluxo de debug do ClipsForge",
        "original_filename": "test-video.mp4",
        "file_size": 1024,
        "duration_seconds": 60,
        "processing_status": "uploaded",
        "cloudinary_public_id": "test_video_debug",
        "cloudinary_secure_url": "https://res.cloudinary.com/test/video/upload/test_video_debug.mp4",
        "source": "clipsforge-debug"
    }'
    
    local video_response=$(make_request "POST" "$SUPABASE_URL/rest/v1/videos" "$video_data")
    
    if [ $? -eq 0 ]; then
        log "✅ Vídeo registrado com ID: $VIDEO_ID"
    else
        error "❌ Falha ao registrar vídeo"
        return 1
    fi
}

# 3. Testar transcrição
test_transcription() {
    log "🎤 Testando transcrição..."
    
    if [ -z "$VIDEO_ID" ]; then
        error "❌ VIDEO_ID não definido"
        return 1
    fi
    
    # Simular transcrição inserindo dados diretamente
    echo -e "\n${BLUE}🔊 Simulando transcrição...${NC}"
    
    # Atualizar vídeo com transcrição
    local transcript_data='{
        "transcript": "Olá pessoal, bem-vindos ao meu canal! Hoje vamos falar sobre como criar clips virais usando inteligência artificial. Isso é muito importante para quem quer crescer nas redes sociais. Vamos ver algumas dicas incríveis que vão transformar seus vídeos!",
        "processing_status": "transcribed"
    }'
    
    local update_response=$(make_request "PATCH" "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID" "$transcript_data")
    
    if [ $? -eq 0 ]; then
        log "✅ Transcrição simulada com sucesso"
    else
        error "❌ Falha ao simular transcrição"
        return 1
    fi
}

# 4. Testar análise de conteúdo
test_content_analysis() {
    log "🧠 Testando análise de conteúdo..."
    
    if [ -z "$VIDEO_ID" ]; then
        error "❌ VIDEO_ID não definido"
        return 1
    fi
    
    # Simular análise de conteúdo
    echo -e "\n${BLUE}🔍 Simulando análise de conteúdo...${NC}"
    
    local analysis_uuid=$(uuidgen | tr '[:upper:]' '[:lower:]')
    local analysis_data='{
        "id": "'$analysis_uuid'",
        "video_id": "'$VIDEO_ID'",
        "user_id": "'$USER_ID'",
        "clips_suggestions": [
            {
                "start_time": 5,
                "end_time": 35,
                "duration": 30,
                "title": "Como Criar Clips Virais",
                "description": "Dica incrível sobre clips virais",
                "viral_score": 8.5,
                "hook_strength": 9.2,
                "best_platforms": ["tiktok", "instagram", "youtube"],
                "content_category": "tutorial",
                "hashtags": ["#clips", "#viral", "#ia", "#tutorial"]
            },
            {
                "start_time": 20,
                "end_time": 50,
                "duration": 30,
                "title": "IA para Redes Sociais",
                "description": "Como usar IA nas redes sociais",
                "viral_score": 7.8,
                "hook_strength": 8.1,
                "best_platforms": ["instagram", "youtube", "linkedin"],
                "content_category": "tecnologia",
                "hashtags": ["#ia", "#redessociais", "#tecnologia", "#dicas"]
            }
        ],
        "analysis_completed": true
    }'
    
    local analysis_response=$(make_request "POST" "$SUPABASE_URL/rest/v1/content_analysis" "$analysis_data")
    
    if [ $? -eq 0 ]; then
        log "✅ Análise de conteúdo simulada com sucesso"
        log "🎯 2 sugestões de clips criadas"
    else
        error "❌ Falha ao simular análise"
        return 1
    fi
}

# 5. Testar geração de clips
test_clip_generation() {
    log "✂️ Testando geração de clips..."
    
    if [ -z "$VIDEO_ID" ]; then
        error "❌ VIDEO_ID não definido"
        return 1
    fi
    
    # Chamar função generate-clips
    echo -e "\n${BLUE}🎬 Gerando clips...${NC}"
    local clips_data='{
        "video_id": "'$VIDEO_ID'"
    }'
    
    local clips_response=$(make_request "POST" "$SUPABASE_URL/functions/v1/generate-clips" "$clips_data")
    
    if [ $? -eq 0 ]; then
        local clips_count=$(echo "$clips_response" | jq -r '.clips_generated // 0')
        log "✅ Clips gerados com sucesso: $clips_count clips"
        
        # Verificar clips no banco
        echo -e "\n${BLUE}🔍 Verificando clips no banco...${NC}"
        local check_clips=$(make_request "GET" "$SUPABASE_URL/rest/v1/clips?video_id=eq.$VIDEO_ID&select=*")
        
        local db_clips_count=$(echo "$check_clips" | jq '. | length')
        log "📊 Clips encontrados no banco: $db_clips_count"
        
        if [ "$db_clips_count" -gt 0 ]; then
            log "🎉 SUCESSO! Clips foram criados e salvos no banco!"
            echo -e "\n${GREEN}📋 Resumo dos clips:${NC}"
            echo "$check_clips" | jq -r '.[] | "• " + .title + " (" + (.duration_seconds|tostring) + "s) - Score: " + (.ai_viral_score|tostring)'
        else
            error "❌ Clips não foram salvos no banco"
        fi
    else
        error "❌ Falha na geração de clips"
        return 1
    fi
}

# 6. Relatório final
generate_report() {
    log "📊 Gerando relatório final..."
    
    echo -e "\n${PURPLE}🎬 ClipsForge Debug Report${NC}"
    echo -e "${BLUE}===========================${NC}"
    
    # Verificar dados finais
    if [ ! -z "$USER_ID" ]; then
        echo -e "${GREEN}✅ Usuário criado: $USER_ID${NC}"
    fi
    
    if [ ! -z "$VIDEO_ID" ]; then
        echo -e "${GREEN}✅ Vídeo processado: $VIDEO_ID${NC}"
        
        # Buscar estatísticas finais
        local final_video=$(make_request "GET" "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID&select=*" "" 2>/dev/null)
        local final_clips=$(make_request "GET" "$SUPABASE_URL/rest/v1/clips?video_id=eq.$VIDEO_ID&select=*" "" 2>/dev/null)
        
        local clips_count=$(echo "$final_clips" | jq '. | length' 2>/dev/null || echo "0")
        
        echo -e "${GREEN}📊 Total de clips gerados: $clips_count${NC}"
        
        if [ "$clips_count" -gt 0 ]; then
            echo -e "${GREEN}🎉 TESTE COMPLETO - SUCESSO!${NC}"
            echo -e "${BLUE}✅ Todo o fluxo funcionou corretamente${NC}"
        else
            echo -e "${RED}⚠️ PROBLEMA IDENTIFICADO${NC}"
            echo -e "${YELLOW}❌ Clips não foram gerados${NC}"
        fi
    fi
    
    echo -e "\n${BLUE}🔍 Para investigar problemas:${NC}"
    echo -e "${YELLOW}• Verifique logs: supabase functions logs${NC}"
    echo -e "${YELLOW}• Execute: ./scripts/test-functions.sh${NC}"
    echo -e "${YELLOW}• Verifique banco: supabase db logs${NC}"
}

# Executar todos os testes
main() {
    create_test_user || exit 1
    test_upload || exit 1
    test_transcription || exit 1
    test_content_analysis || exit 1
    test_clip_generation || exit 1
    generate_report
}

# Executar script
main