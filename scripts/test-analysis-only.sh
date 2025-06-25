#!/bin/bash

echo "🔍 TESTE ESPECÍFICO: ANÁLISE DE CONTEÚDO"
echo "========================================"

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
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Erro no login"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login OK - User ID: $USER_ID"

# Criar vídeo no banco de dados para teste
echo ""
echo "📹 Criando vídeo de teste no banco..."

TIMESTAMP=$(date +%s)
PUBLIC_ID="test-analysis-${TIMESTAMP}"

CREATE_VIDEO_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/videos" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"title\": \"Vídeo de Teste Análise\",
    \"original_filename\": \"test-analysis.mp4\",
    \"file_size_bytes\": 1000000,
    \"duration_seconds\": 180,
    \"processing_status\": \"analyzing\",
    \"cloudinary_public_id\": \"${PUBLIC_ID}\",
    \"cloudinary_secure_url\": \"https://test-url.com/video.mp4\",
    \"transcription\": {
      \"text\": \"Olá pessoal, bem-vindos ao meu canal! Hoje vou compartilhar dicas incríveis sobre como criar conteúdo viral para redes sociais. Primeiro, vou ensinar como identificar tendências. Segundo, como criar ganchos poderosos que capturam atenção nos primeiros segundos. Terceiro, técnicas de storytelling que mantêm o público engajado. Por fim, estratégias de call-to-action que convertem visualizações em seguidores. Lembrem-se: consistência é fundamental para crescer nas redes sociais!\",
      \"segments\": []
    }
  }")

echo "📹 Resposta da criação do vídeo:"
echo $CREATE_VIDEO_RESPONSE | jq .

VIDEO_ID=$(echo $CREATE_VIDEO_RESPONSE | jq -r '.[0].id // empty')

if [ -z "$VIDEO_ID" ]; then
  echo "❌ Erro ao criar vídeo de teste"
  exit 1
fi

echo "✅ Vídeo criado - ID: $VIDEO_ID"

# Teste de análise de conteúdo
echo ""
echo "🔍 Testando análise de conteúdo..."

TRANSCRIPT="Olá pessoal, bem-vindos ao meu canal! Hoje vou compartilhar dicas incríveis sobre como criar conteúdo viral para redes sociais. Primeiro, vou ensinar como identificar tendências que estão bombando no TikTok e Instagram. Segundo, como criar ganchos poderosos que capturam atenção nos primeiros segundos - isso é crucial! Terceiro, técnicas de storytelling que mantêm o público engajado do início ao fim. Por fim, estratégias de call-to-action que convertem visualizações em seguidores fiéis. Lembrem-se: consistência é fundamental para crescer nas redes sociais! Não esqueçam de curtir este vídeo e se inscrever no canal para mais dicas como essa."

ANALYSIS_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/analyze-content" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"${VIDEO_ID}\",
    \"transcript\": \"${TRANSCRIPT}\"
  }")

echo "📤 Resposta da análise:"
echo $ANALYSIS_RESPONSE | jq .

SUCCESS=$(echo $ANALYSIS_RESPONSE | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Análise realizada com sucesso!"
  
  CLIPS_COUNT=$(echo $ANALYSIS_RESPONSE | jq -r '.clips_found // 0')
  echo "📊 Clips identificados: $CLIPS_COUNT"
  
  CLIPS=$(echo $ANALYSIS_RESPONSE | jq -r '.clips_suggestions // []')
  echo "🎬 Clips sugeridos:"
  echo $CLIPS | jq -r '.[] | "• " + .title + " (score: " + (.viral_score|tostring) + ")"'
  
  # Verificar se foi salva no banco
  echo ""
  echo "🔍 Verificando análise no banco de dados..."
  
  DB_RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/content_analysis?video_id=eq.${VIDEO_ID}&select=*" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "apikey: ${SUPABASE_KEY}")
  
  echo "📊 Análise no banco:"
  echo $DB_RESPONSE | jq .
  
else
  echo "❌ Erro na análise"
  ERROR=$(echo $ANALYSIS_RESPONSE | jq -r '.error // "Erro desconhecido"')
  echo "📋 Erro: $ERROR"
fi

echo ""
echo "🎉 TESTE DE ANÁLISE CONCLUÍDO" 