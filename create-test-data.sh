#!/bin/bash

# Script para criar dados de teste para geração de clips
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjZaazJScitYbGViSnBiYTgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3Jnd2J0ZHpkZWlib2J1dmVlZ2ZwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0ZGQzOGVmNC1mNWZjLTQ0OWUtYmQ0Zi01Mjk3MTYwMzZhY2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwNzk1ODQ0LCJpYXQiOjE3NTA3OTIyNDQsImVtYWlsIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BTFYtVWpYTXJZbnc2dlk5Zy1SSVVFWmNOelRRd0sxOUFqNFBLemY5ZmVWRzhTMWQ1MjMyNXc9czk2LWMiLCJlbWFpbCI6Imx1a2Fzd3AxMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJsdWthc3dwMTBAZ21haWwuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FMVi1ValhNclludzZ2WTlnLVJJVUVaY056VFF3SzE5QWo0UEt6ZjlmZVZHOFMxZDUyMzI1dz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIiwic3ViIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTA3ODg1Mzh9XSwic2Vzc2lvbl9pZCI6IjhkMDE5Yzc5LTM3YTgtNGI4ZC04NzkzLTFlMjY5NTFmZjk2MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.HXdPCiXLXc0ZpV_UKbS_p9Y-praAFzocQBNKAshLN3A"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"
USER_ID="4dd38ef4-f5fc-449e-bd4f-5297160363cf"

echo "🎬 CRIANDO DADOS DE TESTE"
echo "========================="

# 1. Criar vídeo de teste
VIDEO_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo "📹 Criando vídeo de teste: $VIDEO_ID"

VIDEO_DATA='{
  "id": "'$VIDEO_ID'",
  "user_id": "'$USER_ID'",
  "original_filename": "test_video.mp4",
  "duration_seconds": 120,
  "cloudinary_public_id": "videos/test_video_123",
  "cloudinary_secure_url": "https://res.cloudinary.com/demo/video/upload/v1234567890/videos/test_video_123.mp4",
  "transcription": {
    "text": "Este é um vídeo de teste sobre tecnologia e inovação. Vamos falar sobre inteligência artificial e como ela está mudando o mundo.",
    "language": "pt",
    "segments": [
      {"start": 0, "end": 30, "text": "Este é um vídeo de teste sobre tecnologia"},
      {"start": 30, "end": 60, "text": "Vamos falar sobre inteligência artificial"},
      {"start": 60, "end": 120, "text": "Como ela está mudando o mundo"}
    ]
  },
  "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
}'

curl -s -X POST "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$VIDEO_DATA" | jq

# 2. Criar análise de conteúdo com sugestões de clips
echo ""
echo "🧠 Criando análise de conteúdo..."

ANALYSIS_DATA='{
  "video_id": "'$VIDEO_ID'",
  "user_id": "'$USER_ID'",
  "clips_suggestions": [
    {
      "start_time": 5,
      "end_time": 25,
      "duration": 20,
      "title": "Introdução sobre Tecnologia",
      "description": "Momento inicial explicando o tema do vídeo",
      "viral_score": 8.5,
      "hook_strength": 9.0,
      "best_platforms": ["tiktok", "instagram"],
      "content_category": "educacional",
      "hashtags": ["#tecnologia", "#inovacao", "#ia"],
      "increment_value": 1
    },
    {
      "start_time": 35,
      "end_time": 55,
      "duration": 20,
      "title": "IA Mudando o Mundo",
      "description": "Discussão sobre o impacto da inteligência artificial",
      "viral_score": 9.2,
      "hook_strength": 8.8,
      "best_platforms": ["youtube", "tiktok"],
      "content_category": "educacional",
      "hashtags": ["#ia", "#inteligenciaartificial", "#futuro"],
      "increment_value": 1
    },
    {
      "start_time": 70,
      "end_time": 90,
      "duration": 20,
      "title": "Transformação Digital",
      "description": "Como a tecnologia está transformando nossa sociedade",
      "viral_score": 8.0,
      "hook_strength": 7.5,
      "best_platforms": ["linkedin", "youtube"],
      "content_category": "educacional",
      "hashtags": ["#transformacaodigital", "#sociedade", "#tech"],
      "increment_value": 1
    }
  ],
  "main_topics": ["tecnologia", "inteligencia artificial", "inovacao"],
  "content_type": "educacional",
  "analysis_completed_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
}'

curl -s -X POST "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/content_analysis" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$ANALYSIS_DATA" | jq

echo ""
echo "✅ Dados de teste criados!"
echo "📹 Video ID: $VIDEO_ID"
echo ""
echo "🎬 Agora testando geração de clips..."

# 3. Testar geração de clips
GENERATE_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/generate-clips' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\":\"$VIDEO_ID\"}")

echo "$GENERATE_RESPONSE" | jq

# 4. Verificar clips gerados
echo ""
echo "🔍 Verificando clips gerados..."
sleep 5

CLIPS_RESPONSE=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.$VIDEO_ID&select=*" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY")

echo "$CLIPS_RESPONSE" | jq

CLIPS_COUNT=$(echo "$CLIPS_RESPONSE" | jq '. | length')
echo ""
echo "🎉 RESULTADO: $CLIPS_COUNT clips gerados!"

if [ "$CLIPS_COUNT" -gt 0 ]; then
  echo "✅ SUCESSO! A geração de clips está funcionando!"
else
  echo "❌ FALHOU! Nenhum clip foi gerado."
fi 