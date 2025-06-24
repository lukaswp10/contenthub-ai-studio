#!/bin/bash

# Script final para testar geração de clips com token válido
VIDEO_ID="48622c2b-c330-4c93-b4b3-d6bf092492c0"
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjZaazJScitYbGViSnBiYTgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3Jnd2J0ZHpkZWlib2J1dmVlZ2ZwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0ZGQzOGVmNC1mNWZjLTQ0OWUtYmQ0Zi01Mjk3MTYwMzZhY2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwNzk1ODQ0LCJpYXQiOjE3NTA3OTIyNDQsImVtYWlsIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BTFYtVWpYTXJZbnc2dlk5Zy1SSVVFWmNOelRRd0sxOUFqNFBLemY5ZmVWRzhTMWQ1MjMyNXc9czk2LWMiLCJlbWFpbCI6Imx1a2Fzd3AxMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJsdWthc3dwMTBAZ21haWwuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FMVi1ValhNclludzZ2WTlnLVJJVUVaY056VFF3SzE5QWo0UEt6ZjlmZVZHOFMxZDUyMzI1dz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIiwic3ViIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTA3ODg1Mzh9XSwic2Vzc2lvbl9pZCI6IjhkMDE5Yzc5LTM3YTgtNGI4ZC04NzkzLTFlMjY5NTFmZjk2MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.HXdPCiXLXc0ZpV_UKbS_p9Y-praAFzocQBNKAshLN3A"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

echo "🎬 TESTE FINAL DE GERAÇÃO DE CLIPS"
echo "==================================="
echo "📹 Video ID: $VIDEO_ID"
echo ""

# 1. Verificar se o vídeo existe
echo "🔍 PASSO 1: Verificando vídeo..."
VIDEO_CHECK=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos?id=eq.$VIDEO_ID&select=id,original_filename,duration_seconds,status,cloudinary_public_id,cloudinary_secure_url" \
  -H "Authorization: Bearer $TOKEN" \
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
  -H "Authorization: Bearer $TOKEN" \
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
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY")

echo "$EXISTING_CLIPS" | jq
EXISTING_COUNT=$(echo "$EXISTING_CLIPS" | jq '. | length')
echo "📊 Clips existentes: $EXISTING_COUNT"

# 4. Chamar função de geração
echo ""
echo "🎬 PASSO 4: Chamando função de geração de clips..."
GENERATE_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/generate-clips' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\":\"$VIDEO_ID\"}")

echo "$GENERATE_RESPONSE" | jq

# 5. Verificar resultado
echo ""
echo "🔍 PASSO 5: Verificando clips gerados..."
sleep 10

FINAL_CLIPS=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.$VIDEO_ID&select=id,title,start_time_seconds,end_time_seconds,duration_seconds,ai_viral_score,cloudinary_secure_url,status&order=ai_viral_score.desc" \
  -H "Authorization: Bearer $TOKEN" \
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
  echo ""
  echo "🌐 Acesse o dashboard em: http://localhost:8080"
else
  echo "❌ FALHOU! Nenhum novo clip foi gerado."
  echo ""
  echo "🔍 Debug - Response da função:"
  echo "$GENERATE_RESPONSE"
fi 