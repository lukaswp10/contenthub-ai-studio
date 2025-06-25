#!/bin/bash

# Script de teste manual - execute passo a passo
echo "🚀 Teste manual do fluxo de upload"

# Configurações
VIDEO_FILE="/home/lucasmartins/Downloads/videoplayback (1).mp4"
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

# Informações do arquivo
FILE_SIZE=$(stat -c%s "$VIDEO_FILE")
FILE_NAME=$(basename "$VIDEO_FILE")

echo "📁 Arquivo: $FILE_NAME"
echo "📏 Tamanho: $FILE_SIZE bytes"

echo ""
echo "🔐 Para fazer login, execute:"
echo "curl -s -X POST \"$SUPABASE_URL/auth/v1/token?grant_type=password\" \\"
echo "  -H \"apikey: $SUPABASE_ANON_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"SEU_EMAIL\", \"password\": \"SUA_SENHA\"}' | jq ."

echo ""
echo "📤 Para solicitar upload (após obter o ACCESS_TOKEN do login):"
echo "curl -s -X POST \"$SUPABASE_URL/functions/v1/upload-video\" \\"
echo "  -H \"Authorization: Bearer ACCESS_TOKEN\" \\"
echo "  -H \"apikey: $SUPABASE_ANON_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"fileName\": \"$FILE_NAME\", \"fileSize\": $FILE_SIZE, \"contentType\": \"video/mp4\", \"duration\": 75}' | jq ."

echo ""
echo "☁️ Para upload no Cloudinary (após obter os parâmetros):"
echo "curl -s -X POST \"UPLOAD_URL\" \\"
echo "  -F \"public_id=PUBLIC_ID\" \\"
echo "  -F \"folder=FOLDER\" \\"
echo "  -F \"resource_type=video\" \\"
echo "  -F \"type=upload\" \\"
echo "  -F \"timestamp=TIMESTAMP\" \\"
echo "  -F \"video_codec=auto\" \\"
echo "  -F \"audio_codec=auto\" \\"
echo "  -F \"context=CONTEXT\" \\"
echo "  -F \"upload_preset=UPLOAD_PRESET\" \\"
echo "  -F \"signature=SIGNATURE\" \\"
echo "  -F \"api_key=API_KEY\" \\"
echo "  -F \"file=@$VIDEO_FILE\" | jq ."

echo ""
echo "💾 Para atualizar o registro do vídeo:"
echo "curl -s -X PATCH \"$SUPABASE_URL/rest/v1/videos?id=eq.VIDEO_ID\" \\"
echo "  -H \"Authorization: Bearer ACCESS_TOKEN\" \\"
echo "  -H \"apikey: $SUPABASE_ANON_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Prefer: return=minimal\" \\"
echo "  -d '{\"cloudinary_public_id\": \"PUBLIC_ID\", \"cloudinary_secure_url\": \"SECURE_URL\", \"processing_status\": \"queued\"}'"

echo ""
echo "📝 Para iniciar transcrição:"
echo "curl -s -X POST \"$SUPABASE_URL/functions/v1/transcribe-video\" \\"
echo "  -H \"Authorization: Bearer ACCESS_TOKEN\" \\"
echo "  -H \"apikey: $SUPABASE_ANON_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"video_id\": \"VIDEO_ID\", \"cloudinary_url\": \"SECURE_URL\", \"cloudinary_public_id\": \"PUBLIC_ID\"}' | jq ."

echo ""
echo "🔍 Para monitorar status:"
echo "curl -s -X GET \"$SUPABASE_URL/rest/v1/videos?id=eq.VIDEO_ID&select=processing_status,error_message\" \\"
echo "  -H \"Authorization: Bearer ACCESS_TOKEN\" \\"
echo "  -H \"apikey: $SUPABASE_ANON_KEY\" | jq ."

echo ""
echo "🎬 Para verificar clips gerados:"
echo "curl -s -X GET \"$SUPABASE_URL/rest/v1/clips?video_id=eq.VIDEO_ID&select=*\" \\"
echo "  -H \"Authorization: Bearer ACCESS_TOKEN\" \\"
echo "  -H \"apikey: $SUPABASE_ANON_KEY\" | jq ."

echo ""
echo "✅ Execute cada comando substituindo os valores necessários!" 