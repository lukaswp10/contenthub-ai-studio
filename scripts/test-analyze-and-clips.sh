#!/bin/bash

echo "🧠 TESTE: Análise + Geração de Clips"
echo "===================================="

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

# Testar análise de conteúdo
echo "2️⃣ Testando análise de conteúdo..."
ANALYZE_RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/analyze-content" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"video_id\": \"$VIDEO_ID\"}")

if echo "$ANALYZE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Análise concluída!"
    echo "🎯 Clips sugeridos: $(echo "$ANALYZE_RESPONSE" | jq '.clips_found')"
    echo "📋 Principais clips:"
    echo "$ANALYZE_RESPONSE" | jq -r '.clips_suggestions[] | "  • \(.title) (\(.start_time)s-\(.end_time)s) - Score: \(.viral_score)"' | head -3
else
    echo "❌ Erro na análise:"
    echo "$ANALYZE_RESPONSE" | jq '.' 2>/dev/null || echo "$ANALYZE_RESPONSE"
    exit 1
fi

echo ""

# Testar geração de clips
echo "3️⃣ Testando geração de clips..."
CLIPS_RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/generate-clips" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"video_id\": \"$VIDEO_ID\"}")

if echo "$CLIPS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Clips gerados com sucesso!"
    echo "🎬 Total de clips: $(echo "$CLIPS_RESPONSE" | jq '.clips | length')"
    echo "🎨 Usando Shotstack: $(echo "$CLIPS_RESPONSE" | jq -r '.using_shotstack')"
    echo "📋 Clips criados:"
    echo "$CLIPS_RESPONSE" | jq -r '.clips[] | "  • \(.title) (\(.duration)s) - \(.platform_optimized) - Score: \(.viral_score)"'
else
    echo "❌ Erro na geração de clips:"
    echo "$CLIPS_RESPONSE" | jq '.' 2>/dev/null || echo "$CLIPS_RESPONSE"
    exit 1
fi

echo ""

# Aguardar um pouco e verificar status do Shotstack
echo "4️⃣ Verificando status do Shotstack (aguardando 10s)..."
sleep 10

STATUS_RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/check-shotstack-status" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{}")

echo "📊 Status Shotstack:"
echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"

echo ""
echo "🎉 TESTE COMPLETO FINALIZADO!"
echo "=========================="
echo ""
echo "🔗 Acesse a dashboard para ver os clips:"
echo "   https://clipbursts.lovable.app/dashboard" 