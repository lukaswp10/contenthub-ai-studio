#!/bin/bash

echo "🎬 TESTE: Geração de Clips com Shotstack"
echo "========================================"

# Configurações
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

# Video ID do teste anterior
VIDEO_ID="6a968764-8e52-423c-a905-cbe713b182db"

echo "📹 Testando com Video ID: $VIDEO_ID"
echo ""

# Fazer login primeiro
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
    -H "Content-Type: application/json" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -d '{
        "email": "lukaswp10@gmail.com",
        "password": "7pguyrxV!"
    }')

if echo "$LOGIN_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
    echo "✅ Login realizado com sucesso!"
else
    echo "❌ Erro no login:"
    echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    exit 1
fi

echo ""

# Testar geração de clips DIRETAMENTE
echo "2️⃣ Testando geração de clips com Shotstack..."
CLIPS_RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/generate-clips" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"video_id\": \"$VIDEO_ID\"}")

echo "📋 Resposta da função:"
echo "$CLIPS_RESPONSE" | jq '.' 2>/dev/null || echo "$CLIPS_RESPONSE"

if echo "$CLIPS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo ""
    echo "✅ Clips gerados com sucesso!"
    echo "🎬 Total de clips: $(echo "$CLIPS_RESPONSE" | jq '.clips | length')"
    echo "🎨 Usando Shotstack: $(echo "$CLIPS_RESPONSE" | jq -r '.using_shotstack')"
    echo "📋 Clips criados:"
    echo "$CLIPS_RESPONSE" | jq -r '.clips[] | "  • \(.title) (\(.duration)s) - \(.platform_optimized) - Score: \(.viral_score)"'
    
    echo ""
    echo "🔄 Aguardando 15 segundos e verificando status do Shotstack..."
    sleep 15
    
    STATUS_RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/check-shotstack-status" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{}")
    
    echo "📊 Status Shotstack:"
    echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
    
else
    echo "❌ Erro na geração de clips"
    echo "🔍 Verificando se é problema de dados ou configuração..."
fi

echo ""
echo "�� TESTE FINALIZADO!" 