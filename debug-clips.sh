#!/bin/bash

# =============== CONFIGURAÇÕES ===============
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjZaazJScitYbGViSnBiYTgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3Jnd2J0ZHpkZWlib2J1dmVlZ2ZwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0ZGQzOGVmNC1mNWZjLTQ0OWUtYmQ0Zi01Mjk3MTYwMzZhY2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwNzkyMTM4LCJpYXQiOjE3NTA3ODg1MzgsImVtYWlsIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BTFYtVWpYTXJZbnc2dlk5Zy1SSVVFWmNOelRRd0sxOUFqNFBLemY5ZmVWRzhTMWQ1MjMyNXc9czk2LWMiLCJlbWFpbCI6Imx1a2Fzd3AxMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJsdWthc3dwMTBAZ21haWwuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FMVi1ValhNclludzZ2WTlnLVJJVUVaY056VFF3SzE5QWo0UEt6ZjlmZVZHOFMxZDUyMzI1dz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIiwic3ViIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTA3ODg1Mzh9XSwic2Vzc2lvbl9pZCI6IjhkMDE5Yzc5LTM3YTgtNGI4ZC04NzkzLTFlMjY5NTFmZjk2MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.JTHvvdHoBJRK15oxXNoq9gIgr6UCL0sefdnpflI7ac0"

echo "🔍 DEBUG: TESTE DE GERAÇÃO DE CLIPS"
echo "==================================="

# =============== PASSO 1: Teste com dados mínimos ===============
echo "\n🔍 PASSO 1: Teste com dados mínimos..."

GENERATE_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/generate-clips' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "48622c2b-c330-4c93-b4b3-d6bf092492c0",
    "clip_suggestions": [
      {
        "start_time": 10,
        "end_time": 25,
        "title": "Teste",
        "viral_score": 9,
        "hook_strength": 8.5,
        "hashtags": ["#teste"],
        "reason": "Teste",
        "topic": "teste",
        "emotions": ["teste"],
        "best_platforms": ["tiktok"],
        "content_category": "teste"
      }
    ],
    "cloudinary_public_id": "videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4"
  }')

echo "Response completa:"
echo "$GENERATE_RESPONSE" | jq

# =============== PASSO 2: Verificar se há algum problema com os dados ===============
echo "\n🔍 PASSO 2: Verificando estrutura dos dados..."

echo "Dados enviados:"
cat << 'EOF' | jq
{
  "video_id": "48622c2b-c330-4c93-b4b3-d6bf092492c0",
  "clip_suggestions": [
    {
      "start_time": 10,
      "end_time": 25,
      "title": "Teste",
      "viral_score": 9,
      "hook_strength": 8.5,
      "hashtags": ["#teste"],
      "reason": "Teste",
      "topic": "teste",
      "emotions": ["teste"],
      "best_platforms": ["tiktok"],
      "content_category": "teste"
    }
  ],
  "cloudinary_public_id": "videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4"
}
EOF

echo "\n�� DEBUG FINALIZADO!" 