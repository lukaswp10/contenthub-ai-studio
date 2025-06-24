#!/bin/bash

# Script para testar geração de clips diretamente
# Usando SERVICE_ROLE_KEY para bypass de autenticação

VIDEO_ID="48622c2b-c330-4c93-b4b3-d6bf092492c0"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2NzM0MiwiZXhwIjoyMDY1NjQzMzQyfQ.4OtNdJdTNJgcOcHwrGGCKYJhNzTyHtNYRQnhWvgzd-k"

echo "🎬 TESTE DIRETO DE GERAÇÃO DE CLIPS"
echo "===================================="
echo "📹 Video ID: $VIDEO_ID"
echo ""

# 1. Verificar se o vídeo existe
echo "🔍 PASSO 1: Verificando vídeo..."
VIDEO_CHECK=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos?id=eq.$VIDEO_ID&select=id,original_filename,duration_seconds,status,cloudinary_public_id,cloudinary_secure_url" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $ANON_KEY")

echo "$VIDEO_CHECK" | jq

if [ "$(echo "$VIDEO_CHECK" | jq '. | length')" -eq 0 ]; then
  echo "❌ Vídeo não encontrado!"
  exit 1
fi

echo "✅ Vídeo encontrado!"

# 2. Verificar análise de conteúdo
echo ""
echo "🧠 PASSO 2: Verificando análise de conteúdo..."
ANALYSIS_CHECK=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/content_analysis?video_id=eq.$VIDEO_ID&select=clips_suggestions" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $ANON_KEY")

echo "$ANALYSIS_CHECK" | jq

CLIPS_COUNT=$(echo "$ANALYSIS_CHECK" | jq '.[0].clips_suggestions | length // 0')
echo "📊 Sugestões de clips encontradas: $CLIPS_COUNT"

if [ "$CLIPS_COUNT" -eq 0 ]; then
  echo "❌ Nenhuma sugestão de clip encontrada!"
  exit 1
fi

# 3. Verificar clips existentes antes
echo ""
echo "🔍 PASSO 3: Verificando clips existentes..."
EXISTING_CLIPS=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.$VIDEO_ID&select=id,title,duration_seconds,ai_viral_score" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $ANON_KEY")

echo "$EXISTING_CLIPS" | jq
EXISTING_COUNT=$(echo "$EXISTING_CLIPS" | jq '. | length')
echo "📊 Clips existentes: $EXISTING_COUNT"

# 4. Chamar função de geração
echo ""
echo "🎬 PASSO 4: Chamando função de geração de clips..."
GENERATE_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/generate-clips' \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\":\"$VIDEO_ID\"}")

echo "$GENERATE_RESPONSE" | jq

# 5. Verificar resultado
echo ""
echo "🔍 PASSO 5: Verificando clips gerados..."
sleep 5

FINAL_CLIPS=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.$VIDEO_ID&select=id,title,start_time_seconds,end_time_seconds,duration_seconds,ai_viral_score,cloudinary_secure_url,status&order=ai_viral_score.desc" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $ANON_KEY")

echo "$FINAL_CLIPS" | jq

FINAL_COUNT=$(echo "$FINAL_CLIPS" | jq '. | length')
NEW_CLIPS=$((FINAL_COUNT - EXISTING_COUNT))

echo ""
echo "🎉 RESULTADO FINAL"
echo "=================="
echo "📊 Clips antes: $EXISTING_COUNT"
echo "📊 Clips depois: $FINAL_COUNT"
echo "🆕 Novos clips: $NEW_CLIPS"
echo ""

if [ "$NEW_CLIPS" -gt 0 ]; then
  echo "✅ SUCESSO! $NEW_CLIPS novos clips foram gerados!"
  echo ""
  echo "🔗 URLs dos clips:"
  echo "$FINAL_CLIPS" | jq -r '.[] | "- \(.title): \(.cloudinary_secure_url)"'
else
  echo "❌ FALHOU! Nenhum novo clip foi gerado."
  echo ""
  echo "🔍 Debug - Response da função:"
  echo "$GENERATE_RESPONSE"
fi 