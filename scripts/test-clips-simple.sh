#!/bin/bash

echo "🔧 TESTE SIMPLES: DEBUG GENERATE-CLIPS"
echo "======================================"

# Configurações
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Login
LOGIN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // empty')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id // empty')

echo "✅ Login OK - User ID: $USER_ID"

# Usar um vídeo existente do teste anterior
echo ""
echo "🔍 Buscando vídeo existente..."

EXISTING_VIDEOS=$(curl -s "${SUPABASE_URL}/rest/v1/videos?user_id=eq.${USER_ID}&select=id,title,duration_seconds&limit=1" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}")

VIDEO_ID=$(echo $EXISTING_VIDEOS | jq -r '.[0].id // empty')

if [ -z "$VIDEO_ID" ]; then
  echo "❌ Nenhum vídeo encontrado. Execute primeiro um teste completo."
  exit 1
fi

echo "✅ Usando vídeo existente - ID: $VIDEO_ID"

# Testar geração de clips com logs detalhados
echo ""
echo "🎬 Testando geração de clips com logs..."

# Fazer a chamada e capturar tanto a resposta quanto possíveis erros
CLIPS_RESPONSE=$(curl -v -X POST "${SUPABASE_URL}/functions/v1/generate-clips" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\": \"${VIDEO_ID}\"}" 2>&1)

echo "📤 Resposta completa (incluindo headers):"
echo "$CLIPS_RESPONSE"

# Extrair apenas o JSON da resposta
JSON_RESPONSE=$(echo "$CLIPS_RESPONSE" | tail -n 1)

echo ""
echo "📋 JSON extraído:"
echo "$JSON_RESPONSE" | jq . 2>/dev/null || echo "Não foi possível parsear JSON: $JSON_RESPONSE"

echo ""
echo "🎉 TESTE SIMPLES CONCLUÍDO" 