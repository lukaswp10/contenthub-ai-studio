#!/bin/bash

# Script para testar upload do Cloudinary via cURL
# Usando os parâmetros exatos dos logs

echo "=== Teste de Upload Cloudinary via cURL ==="
echo ""

# Parâmetros baseados nos logs
CLOUD_NAME="dyqjxsnjp"
API_KEY="586415153212745"
SIGNATURE="cdbde82cfacd9c2b55c6597d794cfa73ff3fb442"  # Assinatura correta gerada com o segredo completo
TIMESTAMP="1750710736"
USER_ID="4dd38ef4-f5fc-449e-bd4f-529716036acf"
PUBLIC_ID="videos/${USER_ID}/1750710736_videoplayback_mp4"
FOLDER="videos/${USER_ID}"
CONTEXT="user_id=${USER_ID}|original_filename=videoplayback.mp4|upload_source=contenthub-ai"
UPLOAD_PRESET="ml_default"

echo "Parâmetros:"
echo "  Cloud Name: $CLOUD_NAME"
echo "  API Key: $API_KEY"
echo "  Signature: $SIGNATURE"
echo "  Timestamp: $TIMESTAMP"
echo "  Public ID: $PUBLIC_ID"
echo "  Folder: $FOLDER"
echo "  Context: $CONTEXT"
echo "  Upload Preset: $UPLOAD_PRESET"
echo ""

# URL do endpoint
UPLOAD_URL="https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload"

echo "URL: $UPLOAD_URL"
echo ""

# Comando cURL
echo "Executando cURL..."
echo ""

curl -X POST "$UPLOAD_URL" \
  -F "file=@test-video.mp4" \
  -F "public_id=$PUBLIC_ID" \
  -F "folder=$FOLDER" \
  -F "resource_type=video" \
  -F "type=upload" \
  -F "timestamp=$TIMESTAMP" \
  -F "video_codec=auto" \
  -F "audio_codec=auto" \
  -F "context=$CONTEXT" \
  -F "upload_preset=$UPLOAD_PRESET" \
  -F "signature=$SIGNATURE" \
  -F "api_key=$API_KEY" \
  -v

echo ""
echo "=== Fim do teste ===" 