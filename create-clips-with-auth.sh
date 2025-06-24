#!/bin/bash

# =============== CONFIGURAÇÕES ===============
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"
VIDEO_ID="48622c2b-c330-4c93-b4b3-d6bf092492c0"
USER_ID="4dd38ef4-f5fc-449e-bd4f-529716036acf"

echo "🎬 CRIAÇÃO DE CLIPS COM AUTENTICAÇÃO"
echo "===================================="

# =============== PASSO 1: Obter novo token ===============
echo "\n🔑 PASSO 1: Obtendo novo token..."

TOKEN_RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"lucaswp10@gmail.com","password":"teste123"}')

echo "Token response:"
echo "$TOKEN_RESPONSE" | jq

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erro ao obter token. Abortando."
  exit 1
fi

echo "✅ Token obtido com sucesso"

# =============== PASSO 2: Criar clips diretamente ===============
echo "\n🎬 PASSO 2: Criando clips diretamente no banco..."

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

# =============== PASSO 3: Verificar clips criados ===============
echo "\n🔍 PASSO 3: Verificando clips criados..."

CLIPS_RESPONSE=$(curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.$VIDEO_ID&select=id,title,start_time_seconds,end_time_seconds,duration_seconds,ai_viral_score,ai_hook_strength,ai_best_platform,hashtags,cloudinary_secure_url&order=ai_viral_score.desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY")

echo "Clips no banco:"
echo "$CLIPS_RESPONSE" | jq

CLIPS_COUNT=$(echo "$CLIPS_RESPONSE" | jq '. | length')
echo "✅ Total de clips criados: $CLIPS_COUNT"

# =============== RESUMO FINAL ===============
echo "\n🎉 CRIAÇÃO DE CLIPS FINALIZADA!"
echo "================================"
echo "📹 Video ID: $VIDEO_ID"
echo "🎬 Clips criados: $CLIPS_COUNT"
echo ""
echo "🌐 Confira no Dashboard: http://localhost:8081"
echo "📊 Video ID: $VIDEO_ID" 