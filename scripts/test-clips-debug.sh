#!/bin/bash

# Script para testar e debugar a geração de clips
# Uso: ./scripts/test-clips-debug.sh

echo "🔍 Testando geração de clips com debug..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERRO:${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] SUCESSO:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] AVISO:${NC} $1"
}

# Verificar se o Supabase está rodando
log "Verificando se Supabase está rodando..."
if ! pgrep -f "supabase" > /dev/null; then
    error "Supabase não está rodando. Execute: supabase start"
    exit 1
fi

# Buscar um vídeo para teste
log "Buscando vídeo para teste..."
VIDEO_ID=$(curl -s -X POST 'http://localhost:54321/rest/v1/rpc/get_test_video' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJylKDVB3Yd_2YnAjQkgdxqg7KsxNZnJc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJylKDVB3Yd_2YnAjQkgdxqg7KsxNZnJc" \
  -H "Content-Type: application/json" \
  | jq -r '.id // empty' 2>/dev/null)

if [ -z "$VIDEO_ID" ]; then
    # Buscar diretamente na tabela videos
    log "Buscando vídeo diretamente na tabela..."
    VIDEO_ID=$(curl -s 'http://localhost:54321/rest/v1/videos?select=id&processing_status=eq.ready&limit=1' \
      -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJylKDVB3Yd_2YnAjQkgdxqg7KsxNZnJc" \
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJylKDVB3Yd_2YnAjQkgdxqg7KsxNZnJc" \
      | jq -r '.[0].id // empty' 2>/dev/null)
fi

if [ -z "$VIDEO_ID" ]; then
    error "Nenhum vídeo encontrado para teste"
    exit 1
fi

success "Vídeo encontrado: $VIDEO_ID"

# Verificar se já existem clips para este vídeo
log "Verificando clips existentes..."
EXISTING_CLIPS=$(curl -s "http://localhost:54321/rest/v1/clips?video_id=eq.$VIDEO_ID&select=count" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJylKDVB3Yd_2YnAjQkgdxqg7KsxNZnJc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJylKDVB3Yd_2YnAjQkgdxqg7KsxNZnJc" \
  | jq -r 'length // 0' 2>/dev/null)

log "Clips existentes: $EXISTING_CLIPS"

# Testar geração de clips com timeout
log "Iniciando geração de clips com timeout de 60 segundos..."

# Executar em background para poder monitorar
timeout 60s curl -s -X POST 'http://localhost:54321/functions/v1/generate-clips' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\": \"$VIDEO_ID\"}" \
  > /tmp/clips_response.json 2>&1 &

CURL_PID=$!
log "Processo iniciado com PID: $CURL_PID"

# Monitorar progresso
COUNTER=0
while kill -0 $CURL_PID 2>/dev/null; do
    COUNTER=$((COUNTER + 1))
    log "Aguardando... ${COUNTER}s"
    
    # Verificar logs do Supabase
    if [ $((COUNTER % 10)) -eq 0 ]; then
        log "Verificando logs do Supabase..."
        supabase functions logs generate-clips --limit 5 2>/dev/null | tail -5
    fi
    
    sleep 1
    
    # Se passou de 60 segundos, algo está errado
    if [ $COUNTER -gt 60 ]; then
        error "Timeout! Matando processo..."
        kill $CURL_PID 2>/dev/null
        break
    fi
done

# Verificar resultado
if [ -f /tmp/clips_response.json ]; then
    log "Resposta recebida:"
    cat /tmp/clips_response.json | jq . 2>/dev/null || cat /tmp/clips_response.json
    
    # Verificar se houve sucesso
    if cat /tmp/clips_response.json | jq -e '.success' >/dev/null 2>&1; then
        success "Clips gerados com sucesso!"
        CLIPS_COUNT=$(cat /tmp/clips_response.json | jq -r '.clips_generated // 0')
        log "Clips criados: $CLIPS_COUNT"
    else
        error "Falha na geração de clips"
        cat /tmp/clips_response.json | jq -r '.error // "Erro desconhecido"'
    fi
    
    rm -f /tmp/clips_response.json
else
    error "Nenhuma resposta recebida - possível travamento"
fi

# Verificar logs finais
log "Logs finais da função:"
supabase functions logs generate-clips --limit 10 2>/dev/null

log "Teste concluído!" 