#!/bin/bash

# Script para testar uploads do Cloudinary via cURL com múltiplos vídeos
# Usando diferentes configurações para isolar problemas

echo "=== Teste de Upload Cloudinary - Múltiplos Vídeos ==="
echo ""

# Parâmetros baseados nos logs mais recentes
CLOUD_NAME="dyqjxsnjp"
API_KEY="586415153212745"
TIMESTAMP="1750711807"
USER_ID="4dd38ef4-f5fc-449e-bd4f-529716036acf"
UPLOAD_PRESET="ml_default"

# Função para testar upload
test_upload() {
    local test_name="$1"
    local video_file="$2"
    local public_id="$3"
    local signature="$4"
    local folder="$5"
    local context="$6"
    
    echo "🧪 Teste: $test_name"
    echo "📁 Arquivo: $video_file"
    echo "🆔 Public ID: $public_id"
    echo "🔐 Signature: $signature"
    echo ""
    
    # URL do endpoint
    UPLOAD_URL="https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload"
    
    # Comando cURL
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$UPLOAD_URL" \
      -F "file=@$video_file" \
      -F "public_id=$public_id" \
      -F "folder=$folder" \
      -F "resource_type=video" \
      -F "type=upload" \
      -F "timestamp=$TIMESTAMP" \
      -F "video_codec=auto" \
      -F "audio_codec=auto" \
      -F "context=$context" \
      -F "upload_preset=$UPLOAD_PRESET" \
      -F "signature=$signature" \
      -F "api_key=$API_KEY")
    
    # Extrair status HTTP
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo "📊 Status: $http_status"
    if [ "$http_status" = "200" ]; then
        echo "✅ SUCESSO!"
        echo "📄 Resposta: $response_body" | head -c 200
        echo "..."
    else
        echo "❌ ERRO $http_status"
        echo "📄 Resposta: $response_body"
    fi
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Gerar assinatura para os parâmetros
generate_signature() {
    local public_id="$1"
    local folder="$2"
    local context="$3"
    
    # Parâmetros ordenados alfabeticamente
    local params="context=${context}&folder=${folder}&public_id=${public_id}&timestamp=${TIMESTAMP}&type=upload&upload_preset=${UPLOAD_PRESET}"
    
    # Gerar assinatura usando Node.js
    local signature=$(node -e "
    const crypto = require('crypto');
    const params = '$params';
    const secret = 'gJh-IPVTqWOv12GKCDDBJ1gy4i8';
    const signature = crypto.createHash('sha1').update(params + secret).digest('hex');
    console.log(signature);
    ")
    
    echo "$signature"
}

echo "🔧 Gerando assinaturas..."
echo ""

# Teste 1: Vídeo de teste pequeno (que já funcionou)
echo "📝 Teste 1: Vídeo pequeno (teste anterior)"
SIGNATURE1="cdbde82cfacd9c2b55c6597d794cfa73ff3fb442"
test_upload "Vídeo Pequeno" \
    "test-video.mp4" \
    "videos/${USER_ID}/test_small_${TIMESTAMP}" \
    "$SIGNATURE1" \
    "videos/${USER_ID}" \
    "user_id=${USER_ID}|original_filename=test-video.mp4|upload_source=contenthub-ai"

# Teste 2: Vídeo com assinatura gerada dinamicamente
echo "📝 Teste 2: Assinatura gerada dinamicamente"
SIGNATURE2=$(generate_signature \
    "videos/${USER_ID}/test_dynamic_${TIMESTAMP}" \
    "videos/${USER_ID}" \
    "user_id=${USER_ID}|original_filename=test-dynamic.mp4|upload_source=contenthub-ai")

test_upload "Assinatura Dinâmica" \
    "test-video.mp4" \
    "videos/${USER_ID}/test_dynamic_${TIMESTAMP}" \
    "$SIGNATURE2" \
    "videos/${USER_ID}" \
    "user_id=${USER_ID}|original_filename=test-dynamic.mp4|upload_source=contenthub-ai"

# Teste 3: Vídeo com nome simples
echo "📝 Teste 3: Nome simples"
SIGNATURE3=$(generate_signature \
    "videos/${USER_ID}/simple_${TIMESTAMP}" \
    "videos/${USER_ID}" \
    "user_id=${USER_ID}|original_filename=simple.mp4|upload_source=contenthub-ai")

test_upload "Nome Simples" \
    "test-video.mp4" \
    "videos/${USER_ID}/simple_${TIMESTAMP}" \
    "$SIGNATURE3" \
    "videos/${USER_ID}" \
    "user_id=${USER_ID}|original_filename=simple.mp4|upload_source=contenthub-ai"

# Teste 4: Sem folder (teste de configuração)
echo "📝 Teste 4: Sem folder"
SIGNATURE4=$(generate_signature \
    "test_no_folder_${TIMESTAMP}" \
    "" \
    "user_id=${USER_ID}|original_filename=no-folder.mp4|upload_source=contenthub-ai")

test_upload "Sem Folder" \
    "test-video.mp4" \
    "test_no_folder_${TIMESTAMP}" \
    "$SIGNATURE4" \
    "" \
    "user_id=${USER_ID}|original_filename=no-folder.mp4|upload_source=contenthub-ai"

# Teste 5: Contexto mínimo
echo "📝 Teste 5: Contexto mínimo"
SIGNATURE5=$(generate_signature \
    "videos/${USER_ID}/minimal_${TIMESTAMP}" \
    "videos/${USER_ID}" \
    "user_id=${USER_ID}")

test_upload "Contexto Mínimo" \
    "test-video.mp4" \
    "videos/${USER_ID}/minimal_${TIMESTAMP}" \
    "$SIGNATURE5" \
    "videos/${USER_ID}" \
    "user_id=${USER_ID}"

echo "🎯 Todos os testes concluídos!"
echo ""
echo "📋 Resumo:"
echo "- Se o Teste 1 funcionar: O preset e configuração estão OK"
echo "- Se o Teste 2 funcionar: A geração de assinatura está OK"
echo "- Se o Teste 3 funcionar: Nomes simples funcionam"
echo "- Se o Teste 4 funcionar: Upload sem folder funciona"
echo "- Se o Teste 5 funcionar: Contexto mínimo funciona"
echo ""
echo "🔍 Se todos falharem: Problema no preset ou API Key"
echo "🔍 Se alguns funcionarem: Problema na configuração específica" 