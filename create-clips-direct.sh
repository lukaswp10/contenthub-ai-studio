#!/bin/bash

# =============== CONFIGURAÇÕES ===============
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjZaazJScitYbGViSnBiYTgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3Jnd2J0ZHpkZWlib2J1dmVlZ2ZwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0ZGQzOGVmNC1mNWZjLTQ0OWUtYmQ0Zi01Mjk3MTYwMzZhY2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwNzkyMTM4LCJpYXQiOjE3NTA3ODg1MzgsImVtYWlsIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BTFYtVWpYTXJZbnc2dlk5Zy1SSVVFWmNOelRRd0sxOUFqNFBLemY5ZmVWRzhTMWQ1MjMyNXc9czk2LWMiLCJlbWFpbCI6Imx1a2Fzd3AxMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJsdWthc3dwMTBAZ21haWwuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FMVi1ValhNclludzZ2WTlnLVJJVUVaY056VFF3SzE5QWo0UEt6ZjlmZVZHOFMxZDUyMzI1dz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIiwic3ViIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTA3ODg1Mzh9XSwic2Vzc2lvbl9pZCI6IjhkMDE5Yzc5LTM3YTgtNGI4ZC04NzkzLTFlMjY5NTFmZjk2MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.JTHvvdHoBJRK15oxXNoq9gIgr6UCL0sefdnpflI7ac0"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"
VIDEO_ID="48622c2b-c330-4c93-b4b3-d6bf092492c0"
USER_ID="4dd38ef4-f5fc-449e-bd4f-529716036acf"

echo "🎬 CRIAÇÃO DIRETA DE CLIPS NO BANCO"
echo "==================================="

# =============== PASSO 1: Criar clips diretamente ===============
echo "\n🎬 PASSO 1: Criando clips diretamente no banco..."

# Clip 1
CLIP1_RESPONSE=$(curl -s -X POST "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"$VIDEO_ID\",
    \"user_id\": \"$USER_ID\",
    \"clip_number\": 1,
    \"title\": \"Mísseis Iranianos Interceptados no Catar\",
    \"start_time_seconds\": 10,
    \"end_time_seconds\": 25,
    \"duration_seconds\": 15,
    \"cloudinary_public_id\": \"clips/$USER_ID/${VIDEO_ID}_clip_1_$(date +%s)\",
    \"cloudinary_secure_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_10_25,c_fill,w_1080,h_1920,g_center,q_auto:best,f_mp4,vc_h264,ac_aac/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.mp4\",
    \"thumbnail_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_17.5_18.5,c_fill,w_480,h_720,g_center,q_auto:best,f_jpg/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.jpg\",
    \"preview_gif_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_10_13,c_fill,w_320,h_480,g_center,q_auto,f_gif,fps_10/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.gif\",
    \"ai_viral_score\": 9.0,
    \"ai_hook_strength\": 8.5,
    \"ai_best_platform\": [\"tiktok\", \"youtube\"],
    \"ai_detected_emotions\": [\"anger\", \"concern\"],
    \"ai_content_category\": \"news\",
    \"ai_analysis_reason\": \"Revelação sobre mísseis iranianos interceptados no Catar\",
    \"suggested_title\": \"Mísseis Iranianos Interceptados no Catar\",
    \"hashtags\": [\"#Irã\", \"#Catar\", \"#mísseis\", \"#notícias\"],
    \"keywords\": [\"#Irã\", \"#Catar\", \"#mísseis\", \"#notícias\"],
    \"status\": \"ready\"
  }")

echo "Clip 1 criado:"
echo "$CLIP1_RESPONSE" | jq

# Clip 2
CLIP2_RESPONSE=$(curl -s -X POST "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"$VIDEO_ID\",
    \"user_id\": \"$USER_ID\",
    \"clip_number\": 2,
    \"title\": \"Conflito entre EUA e Irã: Entenda o Contexto\",
    \"start_time_seconds\": 30,
    \"end_time_seconds\": 50,
    \"duration_seconds\": 20,
    \"cloudinary_public_id\": \"clips/$USER_ID/${VIDEO_ID}_clip_2_$(date +%s)\",
    \"cloudinary_secure_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_30_50,c_fill,w_1080,h_1920,g_center,q_auto:best,f_mp4,vc_h264,ac_aac/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.mp4\",
    \"thumbnail_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_40_41,c_fill,w_480,h_720,g_center,q_auto:best,f_jpg/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.jpg\",
    \"preview_gif_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_30_33,c_fill,w_320,h_480,g_center,q_auto,f_gif,fps_10/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.gif\",
    \"ai_viral_score\": 9.5,
    \"ai_hook_strength\": 9.0,
    \"ai_best_platform\": [\"tiktok\", \"instagram\"],
    \"ai_detected_emotions\": [\"concern\", \"fear\"],
    \"ai_content_category\": \"news\",
    \"ai_analysis_reason\": \"Explicação do contexto do conflito EUA-Irã\",
    \"suggested_title\": \"Conflito entre EUA e Irã: Entenda o Contexto\",
    \"hashtags\": [\"#EUA\", \"#Irã\", \"#conflito\", \"#geopolítica\"],
    \"keywords\": [\"#EUA\", \"#Irã\", \"#conflito\", \"#geopolítica\"],
    \"status\": \"ready\"
  }")

echo "Clip 2 criado:"
echo "$CLIP2_RESPONSE" | jq

# Clip 3
CLIP3_RESPONSE=$(curl -s -X POST "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_id\": \"$VIDEO_ID\",
    \"user_id\": \"$USER_ID\",
    \"clip_number\": 3,
    \"title\": \"Resposta do Irã ao Ataque Americano\",
    \"start_time_seconds\": 60,
    \"end_time_seconds\": 75,
    \"duration_seconds\": 15,
    \"cloudinary_public_id\": \"clips/$USER_ID/${VIDEO_ID}_clip_3_$(date +%s)\",
    \"cloudinary_secure_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_60_75,c_fill,w_1080,h_1920,g_center,q_auto:best,f_mp4,vc_h264,ac_aac/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.mp4\",
    \"thumbnail_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_67.5_68.5,c_fill,w_480,h_720,g_center,q_auto:best,f_jpg/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.jpg\",
    \"preview_gif_url\": \"https://res.cloudinary.com/dyqjxsnjp/video/upload/t_60_63,c_fill,w_320,h_480,g_center,q_auto,f_gif,fps_10/videos/4dd38ef4-f5fc-449e-bd4f-529716036acf/48622c2b-c330-4c93-b4b3-d6bf092492c0_1750791053_tiktok_test_video_mp4.gif\",
    \"ai_viral_score\": 8.5,
    \"ai_hook_strength\": 8.5,
    \"ai_best_platform\": [\"tiktok\", \"youtube\"],
    \"ai_detected_emotions\": [\"anger\", \"defiance\"],
    \"ai_content_category\": \"news\",
    \"ai_analysis_reason\": \"Resposta do Irã ao ataque americano\",
    \"suggested_title\": \"Resposta do Irã ao Ataque Americano\",
    \"hashtags\": [\"#Irã\", \"#EUA\", \"#resposta\", \"#conflito\"],
    \"keywords\": [\"#Irã\", \"#EUA\", \"#resposta\", \"#conflito\"],
    \"status\": \"ready\"
  }")

echo "Clip 3 criado:"
echo "$CLIP3_RESPONSE" | jq

# =============== PASSO 2: Verificar clips criados ===============
echo "\n🔍 PASSO 2: Verificando clips criados..."

CLIPS_RESPONSE=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.$VIDEO_ID&select=id,title,start_time_seconds,end_time_seconds,duration_seconds,ai_viral_score,ai_hook_strength,ai_best_platform,hashtags,cloudinary_secure_url&order=ai_viral_score.desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY")

echo "Clips no banco:"
echo "$CLIPS_RESPONSE" | jq

CLIPS_COUNT=$(echo "$CLIPS_RESPONSE" | jq '. | length')
echo "✅ Total de clips criados: $CLIPS_COUNT"

# =============== RESUMO FINAL ===============
echo "\n🎉 CRIAÇÃO DIRETA FINALIZADA!"
echo "=============================="
echo "📹 Video ID: $VIDEO_ID"
echo "🎬 Clips criados: $CLIPS_COUNT"
echo ""
echo "🌐 Confira no Dashboard: http://localhost:8081"
 