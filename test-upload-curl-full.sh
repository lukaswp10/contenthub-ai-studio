#!/bin/bash

# =============== CONFIGURAÇÕES ===============
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjZaazJScitYbGViSnBiYTgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3Jnd2J0ZHpkZWlib2J1dmVlZ2ZwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0ZGQzOGVmNC1mNWZjLTQ0OWUtYmQ0Zi01Mjk3MTYwMzZhY2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwNzkyMTM4LCJpYXQiOjE3NTA3ODg1MzgsImVtYWlsIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BTFYtVWpYTXJZbnc2dlk5Zy1SSVVFWmNOelRRd0sxOUFqNFBLemY5ZmVWRzhTMWQ1MjMyNXc9czk2LWMiLCJlbWFpbCI6Imx1a2Fzd3AxMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJsdWthc3dwMTBAZ21haWwuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FMVi1ValhNclludzZ2WTlnLVJJVUVaY056VFF3SzE5QWo0UEt6ZjlmZVZHOFMxZDUyMzI1dz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIiwic3ViIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTA3ODg1Mzh9XSwic2Vzc2lvbl9pZCI6IjhkMDE5Yzc5LTM3YTgtNGI4ZC04NzkzLTFlMjY5NTFmZjk2MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.JTHvvdHoBJRK15oxXNoq9gIgr6UCL0sefdnpflI7ac0"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"
VIDEO_PATH="/home/lucasmartins/Downloads/videoplayback (1).mp4"
VIDEO_NAME="videoplayback_full_test.mp4"
VIDEO_SIZE=$(stat -c %s "$VIDEO_PATH")
VIDEO_DURATION=591

echo "🚀 TESTE COMPLETO DE PIPELINE - UPLOAD ATÉ CLIPS"
echo "================================================="

# =============== PASSO 1: Solicitar URL de upload ===============
echo "\n🎬 PASSO 1: Solicitando URL de upload..."
RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/upload-video' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fileName\":\"$VIDEO_NAME\",\"fileSize\":$VIDEO_SIZE,\"contentType\":\"video/mp4\",\"duration\":$VIDEO_DURATION}")

echo "$RESPONSE" | jq

UPLOAD_URL=$(echo "$RESPONSE" | jq -r '.upload_url')
VIDEO_ID=$(echo "$RESPONSE" | jq -r '.video_id')
PARAMS=$(echo "$RESPONSE" | jq -r '.upload_params')

if [ "$UPLOAD_URL" == "null" ]; then
  echo "❌ Erro ao obter upload_url. Abortando."
  exit 1
fi

echo "✅ Video ID: $VIDEO_ID"

# Extrair campos de upload_params
PUBLIC_ID=$(echo "$PARAMS" | jq -r '.public_id')
FOLDER=$(echo "$PARAMS" | jq -r '.folder')
RESOURCE_TYPE=$(echo "$PARAMS" | jq -r '.resource_type')
TYPE=$(echo "$PARAMS" | jq -r '.type')
TIMESTAMP=$(echo "$PARAMS" | jq -r '.timestamp')
VIDEO_CODEC=$(echo "$PARAMS" | jq -r '.video_codec')
AUDIO_CODEC=$(echo "$PARAMS" | jq -r '.audio_codec')
CONTEXT=$(echo "$PARAMS" | jq -r '.context')
UPLOAD_PRESET=$(echo "$PARAMS" | jq -r '.upload_preset')
SIGNATURE=$(echo "$PARAMS" | jq -r '.signature')
API_KEY=$(echo "$PARAMS" | jq -r '.api_key')

# =============== PASSO 2: Upload do vídeo para o Cloudinary ===============
echo "\n☁️ PASSO 2: Fazendo upload para Cloudinary..."
CLOUDINARY_RESPONSE=$(curl -s -X POST "$UPLOAD_URL" \
  -F "file=@$VIDEO_PATH" \
  -F "public_id=$PUBLIC_ID" \
  -F "folder=$FOLDER" \
  -F "resource_type=$RESOURCE_TYPE" \
  -F "type=$TYPE" \
  -F "timestamp=$TIMESTAMP" \
  -F "video_codec=$VIDEO_CODEC" \
  -F "audio_codec=$AUDIO_CODEC" \
  -F "context=$CONTEXT" \
  -F "upload_preset=$UPLOAD_PRESET" \
  -F "signature=$SIGNATURE" \
  -F "api_key=$API_KEY")

echo "$CLOUDINARY_RESPONSE" | jq

CLOUDINARY_URL=$(echo "$CLOUDINARY_RESPONSE" | jq -r '.secure_url')

if [ "$CLOUDINARY_URL" == "null" ]; then
  echo "❌ Erro no upload para Cloudinary. Abortando."
  exit 1
fi

echo "✅ Upload concluído: $CLOUDINARY_URL"

# =============== PASSO 3: Atualizar status no Supabase ===============
echo "\n📊 PASSO 3: Atualizando status no Supabase..."
RESPONSE=$(curl -s -X PATCH "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos?id=eq.$VIDEO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"cloudinary_public_id\":\"$PUBLIC_ID\",\"cloudinary_secure_url\":\"$CLOUDINARY_URL\"}")

echo "$RESPONSE" | jq

# =============== PASSO 4: Transcrição ===============
echo "\n🎤 PASSO 4: Iniciando transcrição..."
TRANSCRIBE_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/transcribe-video' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\":\"$VIDEO_ID\",\"cloudinary_url\":\"$CLOUDINARY_URL\",\"cloudinary_public_id\":\"$PUBLIC_ID\",\"language\":\"portuguese\"}")

echo "$TRANSCRIBE_RESPONSE" | jq

TRANSCRIBE_SUCCESS=$(echo "$TRANSCRIBE_RESPONSE" | jq -r '.success')
if [ "$TRANSCRIBE_SUCCESS" != "true" ]; then
  echo "❌ Erro na transcrição. Continuando mesmo assim..."
else
  echo "✅ Transcrição concluída"
fi

# =============== PASSO 5: Aguardar um pouco para transcrição processar ===============
echo "\n⏳ Aguardando processamento da transcrição (30s)..."
sleep 30

# =============== PASSO 6: Análise de conteúdo ===============
echo "\n🧠 PASSO 5: Iniciando análise de conteúdo para identificar clips..."
ANALYZE_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/analyze-content' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\":\"$VIDEO_ID\"}")

echo "$ANALYZE_RESPONSE" | jq

ANALYZE_SUCCESS=$(echo "$ANALYZE_RESPONSE" | jq -r '.success')
CLIPS_FOUND=$(echo "$ANALYZE_RESPONSE" | jq -r '.clips_found // 0')

if [ "$ANALYZE_SUCCESS" != "true" ]; then
  echo "❌ Erro na análise de conteúdo. Abortando geração de clips."
  exit 1
fi

echo "✅ Análise concluída: $CLIPS_FOUND clips identificados"

# =============== PASSO 7: Aguardar geração de clips ===============
echo "\n⏳ Aguardando geração automática de clips (60s)..."
sleep 60

# =============== PASSO 8: Verificar clips gerados ===============
echo "\n🎬 PASSO 6: Verificando clips gerados..."
CLIPS_RESPONSE=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.$VIDEO_ID&select=*" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY")

echo "$CLIPS_RESPONSE" | jq

CLIPS_COUNT=$(echo "$CLIPS_RESPONSE" | jq '. | length')
echo "✅ Total de clips gerados: $CLIPS_COUNT"

# =============== PASSO 9: Verificar status final do vídeo ===============
echo "\n📋 PASSO 7: Status final do vídeo..."
FINAL_STATUS=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos?id=eq.$VIDEO_ID&select=*" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY")

echo "$FINAL_STATUS" | jq

# =============== RESUMO FINAL ===============
echo "\n🎉 TESTE COMPLETO FINALIZADO!"
echo "=================================="
echo "📹 Video ID: $VIDEO_ID"
echo "☁️ Cloudinary URL: $CLOUDINARY_URL"
echo "🎤 Transcrição: $([ "$TRANSCRIBE_SUCCESS" = "true" ] && echo "✅ Sucesso" || echo "❌ Falhou")"
echo "🧠 Análise: $([ "$ANALYZE_SUCCESS" = "true" ] && echo "✅ Sucesso ($CLIPS_FOUND sugestões)" || echo "❌ Falhou")"
echo "🎬 Clips gerados: $CLIPS_COUNT"
echo ""
echo "🌐 Confira o resultado no Dashboard: http://localhost:8080"
echo "📊 Video ID para busca: $VIDEO_ID" 