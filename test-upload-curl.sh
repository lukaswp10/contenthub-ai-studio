#!/bin/bash

# =============== CONFIGURAÇÕES ===============
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjZaazJScitYbGViSnBiYTgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3Jnd2J0ZHpkZWlib2J1dmVlZ2ZwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0ZGQzOGVmNC1mNWZjLTQ0OWUtYmQ0Zi01Mjk3MTYwMzZhY2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwNzE4MjQxLCJpYXQiOjE3NTA3MTQ2NDEsImVtYWlsIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BTFYtVWpYTXJZbnc2dlk5Zy1SSVVFWmNOelRRd0sxOUFqNFBLemY5ZmVWRzhTMWQ1MjMyNXc9czk2LWMiLCJlbWFpbCI6Imx1a2Fzd3AxMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoibHVrYXN3cDEwQGdtYWlsLmNvbSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJsdWthc3dwMTBAZ21haWwuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FMVi1ValhNclludzZ2WTlnLVJJVUVaY056VFF3SzE5QWo0UEt6ZjlmZVZHOFMxZDUyMzI1dz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIiwic3ViIjoiMTE1MTU1OTg4NDQ4MDk4OTUxMTcxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTA3MTQ2NDF9XSwic2Vzc2lvbl9pZCI6IjAzZGVmNWIzLTYwN2ItNGQ4OS04YTAzLTkxZDZjNDQ5N2IxMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.okm79wY-YNt0PqT4nyOAjM_pSp4cq9-I9qVr_K8gKtE"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"
VIDEO_PATH="/home/lucasmartins/Downloads/videoplayback (1).mp4"
VIDEO_NAME="videoplayback_short.mp4"
VIDEO_SIZE=$(stat -c %s "$VIDEO_PATH")
VIDEO_DURATION=591

# =============== PASSO 1: Solicitar URL de upload ===============
echo "\n===> Solicitando URL de upload (Supabase Edge Function)..."
RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/upload-video' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fileName\":\"$VIDEO_NAME\",\"fileSize\":$VIDEO_SIZE,\"contentType\":\"video/mp4\",\"duration\":$VIDEO_DURATION}")
echo "$RESPONSE" | jq

UPLOAD_URL=$(echo "$RESPONSE" | jq -r '.upload_url')
VIDEO_ID=$(echo "$RESPONSE" | jq -r '.video_id')
PARAMS=$(echo "$RESPONSE" | jq -r '.upload_params')

if [ "$UPLOAD_URL" == "null" ]; then
  echo "Erro ao obter upload_url. Abortando."
  exit 1
fi

# Extrair cada campo de upload_params
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
echo "\n===> Fazendo upload do vídeo para o Cloudinary..."
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
  echo "Erro no upload para o Cloudinary. Abortando."
  exit 1
fi

# =============== PASSO 3: Atualizar status do vídeo no Supabase ===============
echo "\n===> Atualizando status do vídeo no Supabase..."
RESPONSE=$(curl -s -X PATCH "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos?id=eq.$VIDEO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"cloudinary_public_id\":\"$PUBLIC_ID\",\"cloudinary_secure_url\":\"$CLOUDINARY_URL\"}")
echo "$RESPONSE" | jq

# =============== PASSO 4: Invocar transcrição ===============
echo "\n===> Invocando função de transcrição..."
RESPONSE=$(curl -s -X POST 'https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/transcribe-video' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\":\"$VIDEO_ID\",\"cloudinary_url\":\"$CLOUDINARY_URL\",\"cloudinary_public_id\":\"$PUBLIC_ID\",\"language\":\"english\"}")
echo "$RESPONSE" | jq

echo "\n===> Teste finalizado! Confira o Dashboard." 