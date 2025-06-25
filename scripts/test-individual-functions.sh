#!/bin/bash

echo "🧪 TESTE INDIVIDUAL DAS FUNÇÕES"
echo "==============================="

# Configurações
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Login
echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Erro no login"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login OK"

# Teste 1: Transcribe Video (simulado)
echo ""
echo "🎤 TESTE 1: Transcrição (simulada)"
echo "---------------------------------"

TRANSCRIPT_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/transcribe-video" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "test-video-id-12345",
    "cloudinary_url": "https://test-url.com/video.mp4",
    "simulate_api": true
  }')

echo "📤 Resposta da transcrição:"
echo $TRANSCRIPT_RESPONSE | jq .

# Teste 2: Analyze Content 
echo ""
echo "🔍 TESTE 2: Análise de Conteúdo"
echo "-------------------------------"

ANALYSIS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/analyze-content" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "test-video-id-12345",
    "transcript": "Este é um teste de transcrição para verificar se a análise de conteúdo está funcionando corretamente. Vamos testar como o sistema identifica momentos virais e cria sugestões de clips interessantes para redes sociais."
  }')

echo "📤 Resposta da análise:"
echo $ANALYSIS_RESPONSE | jq .

# Teste 3: Generate Clips
echo ""
echo "🎬 TESTE 3: Geração de Clips"
echo "----------------------------"

CLIPS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/generate-clips" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "test-video-id-12345"
  }')

echo "📤 Resposta da geração de clips:"
echo $CLIPS_RESPONSE | jq .

echo ""
echo "🎉 TESTES INDIVIDUAIS CONCLUÍDOS" 