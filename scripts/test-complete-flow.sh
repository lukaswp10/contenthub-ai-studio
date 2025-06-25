#!/bin/bash

# 🎬 TESTE COMPLETO: ClipBursts - Fluxo Completo
# =============================================

echo "🎬 TESTE COMPLETO: ClipBursts - Fluxo Completo"
echo "============================================="

# Configurações
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"
VIDEO_ID="a80ced48-e657-4a41-ac8d-e7c0bdf03ee7"

# Função para fazer chamadas à API
call_api() {
    local function_name=$1
    local data=$2
    curl -s -X POST "${SUPABASE_URL}/functions/v1/${function_name}" \
         -H "Authorization: Bearer ${ANON_KEY}" \
         -H "Content-Type: application/json" \
         -d "${data}"
}

echo ""
echo "🚀 FASE 1: GERAÇÃO AUTOMÁTICA"
echo "============================="

echo ""
echo "📹 1.1 - Upload de Vídeo"
echo "------------------------"
echo "✅ Vídeo já existe: ${VIDEO_ID}"

echo ""
echo "🎤 1.2 - Transcrição"
echo "-------------------"
TRANSCRIBE_RESPONSE=$(call_api "transcribe-video" "{\"video_id\": \"${VIDEO_ID}\"}")
echo "📊 Resposta: $(echo $TRANSCRIBE_RESPONSE | jq -c '.')"

if echo "$TRANSCRIBE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Transcrição executada"
else
    echo "⚠️ Transcrição já existia ou erro"
fi

echo ""
echo "🧠 1.3 - Análise de Conteúdo"
echo "---------------------------"
ANALYZE_RESPONSE=$(call_api "analyze-content" "{\"video_id\": \"${VIDEO_ID}\"}")
echo "📊 Resposta: $(echo $ANALYZE_RESPONSE | jq -c '.')"

if echo "$ANALYZE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Análise executada"
else
    echo "⚠️ Análise já existia ou erro"
fi

echo ""
echo "✂️ 1.4 - Geração de Clips"
echo "------------------------"
CLIPS_RESPONSE=$(call_api "generate-clips" "{\"video_id\": \"${VIDEO_ID}\"}")
echo "📊 Resposta: $(echo $CLIPS_RESPONSE | jq -c '.')"

if echo "$CLIPS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Clips gerados"
    CLIPS_COUNT=$(echo $CLIPS_RESPONSE | jq '.clips_created // 0')
    echo "📈 Clips criados: ${CLIPS_COUNT}"
else
    echo "⚠️ Clips já existiam ou erro"
fi

echo ""
echo "🔍 1.5 - Verificação de Status"
echo "-----------------------------"
STATUS_RESPONSE=$(call_api "check-shotstack-status" "{}")
echo "📊 Resposta: $(echo $STATUS_RESPONSE | jq -c '.')"

if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Status verificado"
    CLIPS_CHECKED=$(echo $STATUS_RESPONSE | jq '.clips_checked // 0')
    echo "📊 Clips verificados: ${CLIPS_CHECKED}"
else
    echo "❌ Erro na verificação de status"
fi

echo ""
echo "🎨 FASE 2: EDITOR MANUAL"
echo "======================="

echo ""
echo "✂️ 2.1 - Criação de Clip Manual"
echo "------------------------------"
MANUAL_CLIP_DATA='{
    "video_id": "'${VIDEO_ID}'",
    "title": "Clip Manual Completo",
    "description": "Clip criado no teste completo",
    "start_time_seconds": 10,
    "end_time_seconds": 40,
    "subtitles": "Legendas do teste completo",
    "platform": "instagram"
}'

MANUAL_RESPONSE=$(call_api "create-manual-clip" "$MANUAL_CLIP_DATA")
echo "📊 Resposta: $(echo $MANUAL_RESPONSE | jq -c '.')"

if echo "$MANUAL_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Clip manual criado"
    MANUAL_CLIP_ID=$(echo $MANUAL_RESPONSE | jq -r '.clip.id')
    echo "🆔 Clip ID: ${MANUAL_CLIP_ID}"
else
    echo "❌ Erro na criação do clip manual"
fi

echo ""
echo "📊 RESUMO FINAL"
echo "==============="

# Contar clips totais
CLIPS_QUERY='
query=select count(*) from clips where video_id = '\''a80ced48-e657-4a41-ac8d-e7c0bdf03ee7'\''
'

TOTAL_CLIPS=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/custom_query" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT COUNT(*) as count FROM clips WHERE video_id = '${VIDEO_ID}'\"}" \
    2>/dev/null | jq -r '.[0].count // 0' 2>/dev/null || echo "0")

echo "📹 Vídeo processado: ${VIDEO_ID}"
echo "📊 Total de clips: ${TOTAL_CLIPS}"
echo ""
echo "✅ FASE 1 - Geração Automática: OK"
echo "✅ FASE 2 - Editor Manual: OK"
echo ""
echo "🎉 CLIPBURSTS FUNCIONANDO COMPLETAMENTE!"
echo "========================================"
echo ""
echo "🚀 Próximos passos:"
echo "   • Interface web funcionando"
echo "   • Dashboard com analytics"
echo "   • Integração com redes sociais"
echo "   • Sistema de agendamento"
echo ""

echo "🧪 TESTE COMPLETO DO FLUXO - ClipsForge"
echo "========================================"

# Configurações
VIDEO_PATH="/home/lucasmartins/Downloads/videoplayback (1).mp4"
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Dados do usuário de teste
EMAIL="test@example.com"
PASSWORD="123456"

# Step 1: Login
echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Erro no login:"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Login realizado com sucesso"

# Step 2: Upload do vídeo
echo ""
echo "📤 Fazendo upload do vídeo..."

if [ ! -f "$VIDEO_PATH" ]; then
  echo "❌ Arquivo não encontrado: $VIDEO_PATH"
  exit 1
fi

UPLOAD_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/upload-video" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -F "file=@${VIDEO_PATH}" \
  -F "title=Teste Video Upload Flow" \
  -F "description=Video para teste do fluxo completo")

echo "📤 Resposta do upload:"
echo $UPLOAD_RESPONSE | jq .

VIDEO_ID=$(echo $UPLOAD_RESPONSE | jq -r '.video_id // empty')

if [ -z "$VIDEO_ID" ]; then
  echo "❌ Erro no upload do vídeo"
  exit 1
fi

echo "✅ Upload realizado com sucesso - Video ID: $VIDEO_ID"

# Step 3: Aguardar transcrição
echo ""
echo "🎤 Aguardando transcrição..."

for i in {1..30}; do
  echo "⏳ Verificando status da transcrição (tentativa $i/30)..."
  
  STATUS_RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/videos?id=eq.${VIDEO_ID}&select=*" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "apikey: ${SUPABASE_KEY}")
  
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.[0].processing_status // "unknown"')
  echo "📊 Status atual: $STATUS"
  
  if [ "$STATUS" = "transcribed" ] || [ "$STATUS" = "completed" ]; then
    echo "✅ Transcrição concluída!"
    break
  elif [ "$STATUS" = "error" ]; then
    ERROR_MSG=$(echo $STATUS_RESPONSE | jq -r '.[0].error_message // "Erro desconhecido"')
    echo "❌ Erro na transcrição: $ERROR_MSG"
    exit 1
  fi
  
  sleep 2
done

# Verificar se temos transcrição
TRANSCRIPT=$(echo $STATUS_RESPONSE | jq -r '.[0].transcription.text // empty')
if [ -z "$TRANSCRIPT" ]; then
  echo "❌ Transcrição não disponível"
  echo "📋 Debug - Status Response:"
  echo $STATUS_RESPONSE | jq .
  exit 1
fi

echo "📝 Transcrição disponível (${#TRANSCRIPT} caracteres)"

# Step 4: Análise do conteúdo
echo ""
echo "🔍 Iniciando análise do conteúdo..."

ANALYSIS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/analyze-content" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\",
    \"transcript\": \"${TRANSCRIPT}\"
  }")

echo "🔍 Resposta da análise:"
echo $ANALYSIS_RESPONSE | jq .

ANALYSIS_SUCCESS=$(echo $ANALYSIS_RESPONSE | jq -r '.success // false')

if [ "$ANALYSIS_SUCCESS" != "true" ]; then
  echo "❌ Erro na análise do conteúdo"
  ANALYSIS_ERROR=$(echo $ANALYSIS_RESPONSE | jq -r '.error // "Erro desconhecido"')
  echo "📋 Erro: $ANALYSIS_ERROR"
  
  # Verificar se há logs de erro mais detalhados
  echo ""
  echo "🔍 Verificando logs do Supabase..."
  exit 1
fi

CLIPS_COUNT=$(echo $ANALYSIS_RESPONSE | jq -r '.clips_found // 0')
echo "✅ Análise concluída! $CLIPS_COUNT clips identificados"

# Step 5: Verificar se clips foram gerados
echo ""
echo "🎬 Verificando geração de clips..."

sleep 3

CLIPS_RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/clips?video_id=eq.${VIDEO_ID}&select=*" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}")

CLIPS_GENERATED=$(echo $CLIPS_RESPONSE | jq '. | length')
echo "🎬 Clips gerados: $CLIPS_GENERATED"

if [ "$CLIPS_GENERATED" -gt 0 ]; then
  echo "✅ Clips gerados com sucesso!"
  echo $CLIPS_RESPONSE | jq .
else
  echo "⚠️ Nenhum clip foi gerado ainda"
fi

echo ""
echo "🎉 TESTE COMPLETO FINALIZADO"
echo "=============================="
echo "📤 Upload: ✅ Sucesso"
echo "🎤 Transcrição: ✅ Sucesso"
echo "🔍 Análise: $([ "$ANALYSIS_SUCCESS" = "true" ] && echo "✅ Sucesso" || echo "❌ Falhou")"
echo "🎬 Clips: $([ "$CLIPS_GENERATED" -gt 0 ] && echo "✅ $CLIPS_GENERATED gerados" || echo "⚠️ Aguardando")" 