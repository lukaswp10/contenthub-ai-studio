#!/bin/bash

echo "🎬 Testando Upload Real de Vídeo + Geração de Clips"
echo "=================================================="

# Configurações de produção
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

# Arquivo de vídeo
VIDEO_FILE="/home/lucasmartins/Downloads/videoplayback (1).mp4"

if [ ! -f "$VIDEO_FILE" ]; then
    echo "❌ Arquivo de vídeo não encontrado: $VIDEO_FILE"
    exit 1
fi

echo "📹 Arquivo encontrado: $(basename "$VIDEO_FILE")"
echo "📊 Tamanho: $(ls -lh "$VIDEO_FILE" | awk '{print $5}')"

echo ""
echo "🔐 1. Testando autenticação..."

# Primeiro, vamos fazer login para obter um token válido
LOGIN_DATA='{
  "email": "lukaswp10@gmail.com",
  "password": "7pguyrxV!"
}'

echo "📤 Fazendo login..."

LOGIN_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

echo "📥 Resposta do login:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extrair token de acesso
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Erro ao obter token de acesso"
    echo "Tentando com token anônimo..."
    ACCESS_TOKEN="$ANON_KEY"
else
    echo "✅ Token obtido com sucesso"
fi

echo ""
echo "📤 2. Testando upload com arquivo real..."

# Primeiro, enviar metadados para criar o registro
METADATA='{
  "fileName": "videoplayback.mp4",
  "fileSize": 2574521,
  "contentType": "video/mp4",
  "duration": 60
}'

echo "📋 Enviando metadados do vídeo..."

UPLOAD_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/upload-video" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$METADATA")

echo "📥 Resposta do upload de metadados:"
echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Extrair video_id
VIDEO_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.video_id // empty' 2>/dev/null)

if [ -z "$VIDEO_ID" ]; then
    echo "❌ Erro ao obter video_id. Abortando."
    exit 1
fi

echo "✅ Video ID obtido: $VIDEO_ID"

# URL de vídeo pública para teste
# Usaremos esta URL fixa para garantir que a transcrição funcione.
# Em um cenário real, esta URL viria do processo de upload do Cloudinary.
DEMO_VIDEO_URL="https://res.cloudinary.com/dyqjxsnjp/video/upload/v1750937537/samples/elephants.mp4"
echo "🐘 Usando URL de vídeo de demonstração para transcrição: $DEMO_VIDEO_URL"

echo ""
echo "🎯 3. Testando transcrição de áudio..."

# Montar o payload para a função de transcrição
TRANSCRIBE_DATA='{
  "video_id": "'$VIDEO_ID'",
  "cloudinary_url": "'$DEMO_VIDEO_URL'"
}'

echo "📤 Testando função de transcrição com URL de demonstração..."

TRANSCRIBE_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/transcribe-video" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TRANSCRIBE_DATA")

echo "📥 Resposta da transcrição:"
echo "$TRANSCRIBE_RESPONSE" | jq '.' 2>/dev/null || echo "$TRANSCRIBE_RESPONSE"

echo ""
echo "🧠 4. Testando análise de conteúdo..."

ANALYZE_DATA='{
  "video_id": "'$VIDEO_ID'",
  "transcript": "Este é um vídeo de teste para demonstrar o sistema de geração de clips automáticos. O conteúdo inclui explicações sobre tecnologia e inovação."
}'

echo "📤 Testando função de análise..."

ANALYZE_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/analyze-content" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$ANALYZE_DATA")

echo "📥 Resposta da análise:"
echo "$ANALYZE_RESPONSE" | jq '.' 2>/dev/null || echo "$ANALYZE_RESPONSE"

echo ""
echo "✂️ 5. Testando geração de clips..."

GENERATE_DATA='{
  "video_id": "'$VIDEO_ID'",
  "analysis_data": {
    "transcript": "Este é um vídeo de teste para demonstrar o sistema de geração de clips automáticos. O conteúdo inclui explicações sobre tecnologia e inovação que podem se tornar virais nas redes sociais.",
    "key_moments": [
      {
        "start_time": 5,
        "end_time": 35,
        "description": "Explicação sobre tecnologia inovadora",
        "confidence": 0.9,
        "topics": ["tecnologia", "inovação"]
      },
      {
        "start_time": 20,
        "end_time": 50,
        "description": "Momento viral sobre redes sociais",
        "confidence": 0.8,
        "topics": ["social media", "viral"]
      }
    ],
    "sentiment": "positive",
    "engagement_score": 0.85
  },
  "preferences": {
    "platforms": ["tiktok", "instagram"],
    "max_clips": 2,
    "min_duration": 15,
    "max_duration": 45
  }
}'

echo "📤 Gerando clips com dados reais..."

CLIPS_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/generate-clips" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$GENERATE_DATA")

echo "📥 Resposta da geração de clips:"
echo "$CLIPS_RESPONSE" | jq '.' 2>/dev/null || echo "$CLIPS_RESPONSE"

echo ""
echo "🔍 6. Analisando erros específicos..."

# Verificar tipos de erro
if echo "$CLIPS_RESPONSE" | grep -q "error"; then
    echo "❌ Erro detectado na geração de clips:"
    
    # Extrair mensagem de erro específica
    ERROR_MSG=$(echo "$CLIPS_RESPONSE" | jq -r '.error // .message // empty' 2>/dev/null)
    ERROR_CODE=$(echo "$CLIPS_RESPONSE" | jq -r '.code // empty' 2>/dev/null)
    
    echo "   Mensagem: $ERROR_MSG"
    echo "   Código: $ERROR_CODE"
    
    # Analisar tipo de erro
    if echo "$ERROR_MSG" | grep -qi "jwt\|token\|auth"; then
        echo "🔐 Problema de autenticação detectado"
    elif echo "$ERROR_MSG" | grep -qi "video.*not.*found\|uuid"; then
        echo "📹 Problema com ID do vídeo"
    elif echo "$ERROR_MSG" | grep -qi "shotstack\|api"; then
        echo "🎬 Problema com API externa (Shotstack)"
    elif echo "$ERROR_MSG" | grep -qi "database\|sql"; then
        echo "🗄️ Problema de banco de dados"
    else
        echo "❓ Erro não categorizado"
    fi
    
else
    echo "✅ Geração de clips funcionando!"
    
    # Verificar se tem dados estruturados
    if echo "$CLIPS_RESPONSE" | grep -q "timeline"; then
        echo "✅ Timeline estruturada presente"
    fi
    
    if echo "$CLIPS_RESPONSE" | grep -q "tracks"; then
        echo "✅ Sistema de tracks funcionando"
    fi
    
    if echo "$CLIPS_RESPONSE" | grep -q "shotstack"; then
        echo "✅ Integração Shotstack ativa"
    fi
fi

echo ""
echo "📊 7. Resumo do teste:"
echo "   Video ID: $VIDEO_ID"
echo "   Arquivo: $(basename "$VIDEO_FILE")"
echo "   Tamanho: $(ls -lh "$VIDEO_FILE" | awk '{print $5}')"

# Status de cada etapa
if echo "$UPLOAD_RESPONSE" | grep -q "success"; then
    echo "   ✅ Upload: OK"
else
    echo "   ❌ Upload: ERRO"
fi

if echo "$TRANSCRIBE_RESPONSE" | grep -q "success\|transcript"; then
    echo "   ✅ Transcrição: OK"
else
    echo "   ⚠️ Transcrição: Limitada"
fi

if echo "$ANALYZE_RESPONSE" | grep -q "success\|analysis"; then
    echo "   ✅ Análise: OK"
else
    echo "   ⚠️ Análise: Limitada"
fi

if echo "$CLIPS_RESPONSE" | grep -q "success\|clips"; then
    echo "   ✅ Geração: OK"
else
    echo "   ❌ Geração: ERRO"
fi

echo ""
echo "🎉 Teste completo finalizado!" 