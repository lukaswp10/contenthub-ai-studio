#!/bin/bash

echo "🎬 TESTE: Geração de Clips Profissionais com Shotstack"
echo "=================================================="

# Configurações
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

# ID do vídeo de teste (do upload anterior)
VIDEO_ID="a80ced48-e657-4a41-ac8d-e7c0bdf03ee7"

echo "📹 Testando com vídeo ID: $VIDEO_ID"
echo ""

# Função para testar geração de clips
test_generate_clips() {
    echo "🎯 TESTE 1: Gerar clips profissionais"
    echo "------------------------------------"
    
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/generate-clips" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"video_id\": \"$VIDEO_ID\"
        }")
    
    echo "📊 Resposta da API:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Verificar se foi bem-sucedido
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ Geração de clips iniciada com sucesso!"
        
        # Extrair informações dos clips
        CLIPS_COUNT=$(echo "$RESPONSE" | jq -r '.clips_generated // 0' 2>/dev/null)
        USING_SHOTSTACK=$(echo "$RESPONSE" | jq -r '.using_shotstack // false' 2>/dev/null)
        
        echo "📈 Clips gerados: $CLIPS_COUNT"
        echo "🎨 Usando Shotstack: $USING_SHOTSTACK"
        
        if [ "$USING_SHOTSTACK" = "true" ]; then
            echo ""
            echo "🎬 CLIPS PROFISSIONAIS CRIADOS:"
            echo "$RESPONSE" | jq -r '.clips[] | "- \(.title) (\(.duration)s) - Score: \(.viral_score) - Plataforma: \(.platform_optimized)"' 2>/dev/null
        else
            echo "⚠️ Shotstack não configurado, usando clips simples do Cloudinary"
        fi
        
        return 0
    else
        echo "❌ Erro na geração de clips"
        return 1
    fi
}

# Função para verificar status dos clips
test_check_status() {
    echo "🔍 TESTE 2: Verificar status dos clips"
    echo "------------------------------------"
    
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/check-shotstack-status" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json")
    
    echo "📊 Resposta da verificação:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ Verificação de status concluída!"
        
        CLIPS_CHECKED=$(echo "$RESPONSE" | jq -r '.clips_checked // 0' 2>/dev/null)
        CLIPS_COMPLETED=$(echo "$RESPONSE" | jq -r '.clips_completed // 0' 2>/dev/null)
        CLIPS_FAILED=$(echo "$RESPONSE" | jq -r '.clips_failed // 0' 2>/dev/null)
        
        echo "📊 Clips verificados: $CLIPS_CHECKED"
        echo "✅ Clips concluídos: $CLIPS_COMPLETED"
        echo "❌ Clips falharam: $CLIPS_FAILED"
        
        return 0
    else
        echo "❌ Erro na verificação de status"
        return 1
    fi
}

# Função para buscar clips no banco
test_fetch_clips() {
    echo "📋 TESTE 3: Buscar clips no banco de dados"
    echo "----------------------------------------"
    
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/clips?select=*&video_id=eq.$VIDEO_ID" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -H "apikey: $SUPABASE_ANON_KEY")
    
    echo "📊 Clips encontrados:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Contar clips
    CLIPS_COUNT=$(echo "$RESPONSE" | jq 'length' 2>/dev/null || echo "0")
    echo "📈 Total de clips: $CLIPS_COUNT"
    
    if [ "$CLIPS_COUNT" -gt 0 ]; then
        echo ""
        echo "🎬 RESUMO DOS CLIPS:"
        echo "$RESPONSE" | jq -r '.[] | "- \(.title) | Status: \(.status) | Score: \(.ai_viral_score) | URL: \(.cloudinary_secure_url)"' 2>/dev/null
        return 0
    else
        echo "⚠️ Nenhum clip encontrado"
        return 1
    fi
}

# Executar testes
echo "🚀 Iniciando testes..."
echo ""

# Teste 1: Gerar clips
if test_generate_clips; then
    echo ""
    echo "⏳ Aguardando 5 segundos antes do próximo teste..."
    sleep 5
    echo ""
    
    # Teste 2: Verificar status
    test_check_status
    echo ""
    
    # Teste 3: Buscar clips
    test_fetch_clips
else
    echo "❌ Teste de geração falhou, pulando outros testes"
fi

echo ""
echo "🎉 TESTES CONCLUÍDOS!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Se usando Shotstack, configure a chave API no ambiente de produção"
echo "2. Os clips profissionais terão legendas, transições e otimização por plataforma"
echo "3. Execute o script de verificação periodicamente para atualizar status"
echo "4. Teste com diferentes tipos de vídeo para validar qualidade"
echo ""
echo "💡 DICA: Para usar Shotstack gratuitamente:"
echo "   - Crie conta em https://shotstack.io"
echo "   - Pegue a API key gratuita (10 créditos)"
echo "   - Configure no Supabase: SHOTSTACK_API_KEY" 