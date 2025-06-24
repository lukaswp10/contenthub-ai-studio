#!/bin/bash

# =============== CONFIGURAÇÕES ===============
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjZaazJScitYbGViSnBiYTgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3Jnd2J0ZHpkZWlib2J1dmVlZ2ZwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0ZGQzOGVmNC1mNWZjLTQ0OWUtYmQ0Zi01Mjk3MTYwMzZhY2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwNzkyMTM4LCJpYXQiOjE3NTA3ODg1MzgsImVtYWlsIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BTFYtVWpYTXJZbnc2dlk5Zy1SSVVFWmNOelRRd0sxOUFqNFBLemY5ZmVWRzhTMWQ1MjMyNXc9czk2LWMiLCJlbWFpbCI6Imx1a2Fzd3AxMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJsdWthc3dwMTBAZ21haWwuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FMVi1ValhNclludzZ2WTlnLVJJVUVaY056VFF3SzE5QWo0UEt6ZjlmZVZHOFMxZDUyMzI1dz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIiwic3ViIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTA3ODg1Mzh9XSwic2Vzc2lvbl9pZCI6IjhkMDE5Yzc5LTM3YTgtNGI4ZC04NzkzLTFlMjY5NTFmZjk2MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.JTHvvdHoBJRK15oxXNoq9gIgr6UCL0sefdnpflI7ac0"
VIDEO_ID="48622c2b-c330-4c93-b4b3-d6bf092492c0"
CLOUDINARY_PUBLIC_ID="videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4"

echo "🎬 GERAÇÃO MANUAL DE CLIPS"
echo "=========================="

# =============== PASSO 1: Obter sugestões de clips ===============
echo "\n📋 PASSO 1: Obtendo sugestões de clips..."
ANALYZE_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/analyze-content' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\":\"$VIDEO_ID\"}")

echo "$ANALYZE_RESPONSE" | jq

ANALYZE_SUCCESS=$(echo "$ANALYZE_RESPONSE" | jq -r '.success')
if [ "$ANALYZE_SUCCESS" != "true" ]; then
  echo "❌ Erro na análise. Abortando."
  exit 1
fi

# =============== PASSO 2: Extrair sugestões ===============
echo "\n📝 PASSO 2: Extraindo sugestões..."
SUGGESTIONS=$(echo "$ANALYZE_RESPONSE" | jq -c '.suggestions')

echo "Sugestões extraídas:"
echo "$SUGGESTIONS" | jq

# =============== PASSO 3: Gerar clips ===============
echo "\n🎬 PASSO 3: Gerando clips..."
GENERATE_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/generate-clips' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"$VIDEO_ID\",
    \"clip_suggestions\": $SUGGESTIONS,
    \"cloudinary_public_id\": \"$CLOUDINARY_PUBLIC_ID\",
    \"preferences\": {
      \"optimizeForMobile\": true,
      \"generateSubtitles\": false,
      \"addWatermark\": false
    }
  }")

echo "$GENERATE_RESPONSE" | jq

GENERATE_SUCCESS=$(echo "$GENERATE_RESPONSE" | jq -r '.success')
if [ "$GENERATE_SUCCESS" = "true" ]; then
  CLIPS_CREATED=$(echo "$GENERATE_RESPONSE" | jq -r '.clips_created')
  echo "✅ Clips gerados com sucesso: $CLIPS_CREATED"
else
  ERROR=$(echo "$GENERATE_RESPONSE" | jq -r '.error')
  echo "❌ Erro na geração: $ERROR"
fi

# =============== PASSO 4: Verificar clips gerados ===============
echo "\n🔍 PASSO 4: Verificando clips gerados..."
sleep 10

CLIPS_RESPONSE=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.$VIDEO_ID&select=id,title,start_time_seconds,end_time_seconds,duration_seconds,ai_viral_score,ai_hook_strength,ai_best_platform,hashtags,cloudinary_secure_url&order=ai_viral_score.desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw")

echo "$CLIPS_RESPONSE" | jq

CLIPS_COUNT=$(echo "$CLIPS_RESPONSE" | jq '. | length')
echo "✅ Total de clips no banco: $CLIPS_COUNT"

# =============== RESUMO FINAL ===============
echo "\n🎉 GERAÇÃO DE CLIPS FINALIZADA!"
echo "================================"
echo "📹 Video ID: $VIDEO_ID"
echo "🧠 Análise: ✅ Sucesso"
echo "🎬 Clips gerados: $CLIPS_COUNT"
echo ""
echo "🌐 Confira no Dashboard: http://localhost:8081"
echo "📊 Video ID: $VIDEO_ID" 