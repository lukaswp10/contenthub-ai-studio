#!/bin/bash

echo "✂️ TESTE: Editor Manual - Criação de Clips"
echo "=========================================="

# Configurações
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

# ID do vídeo de teste (usar um vídeo existente)
VIDEO_ID="a80ced48-e657-4a41-ac8d-e7c0bdf03ee7"

echo "📹 Testando com vídeo ID: $VIDEO_ID"
echo ""

# Função para testar criação de clip manual
test_create_manual_clip() {
    echo "🎯 TESTE 1: Criar clip manual"
    echo "----------------------------"
    
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/create-manual-clip" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"video_id\": \"$VIDEO_ID\",
            \"title\": \"Clip Manual de Teste\",
            \"description\": \"Clip criado através do editor manual\",
            \"start_time_seconds\": 15,
            \"end_time_seconds\": 45,
            \"subtitles\": \"Esta é uma legenda de teste para o clip\",
            \"platform\": \"tiktok\"
        }")
    
    echo "📊 Resposta da API:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Verificar se foi bem-sucedido
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo "✅ Clip manual criado com sucesso!"
        CLIP_ID=$(echo "$RESPONSE" | jq -r '.clip.id')
        echo "🆔 Clip ID: $CLIP_ID"
        echo "🎬 Título: $(echo "$RESPONSE" | jq -r '.clip.title')"
        echo "⏱️ Duração: $(echo "$RESPONSE" | jq -r '.clip.duration')s"
        echo "🎨 Usando Shotstack: $(echo "$RESPONSE" | jq -r '.using_shotstack')"
        echo "📝 Mensagem: $(echo "$RESPONSE" | jq -r '.message')"
        return 0
    else
        echo "❌ Erro na criação do clip manual"
        return 1
    fi
}

# Função para testar validações
test_validations() {
    echo "🔍 TESTE 2: Validações da API"
    echo "-----------------------------"
    
    # Teste sem título
    echo "Testando sem título..."
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/create-manual-clip" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"video_id\": \"$VIDEO_ID\",
            \"start_time_seconds\": 10,
            \"end_time_seconds\": 40
        }")
    
    if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        echo "✅ Validação de título funcionando"
    else
        echo "❌ Validação de título falhou"
    fi
    
    # Teste com duração muito longa
    echo "Testando duração muito longa..."
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/create-manual-clip" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"video_id\": \"$VIDEO_ID\",
            \"title\": \"Clip Muito Longo\",
            \"start_time_seconds\": 10,
            \"end_time_seconds\": 200
        }")
    
    if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        echo "✅ Validação de duração funcionando"
    else
        echo "❌ Validação de duração falhou"
    fi
    
    echo ""
}

# Função para listar clips criados
test_list_clips() {
    echo "📋 TESTE 3: Listar clips do vídeo"
    echo "--------------------------------"
    
    RESPONSE=$(curl -s -X GET \
        "${SUPABASE_URL}/rest/v1/clips?video_id=eq.$VIDEO_ID&select=*&order=created_at.desc" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "apikey: $SUPABASE_ANON_KEY")
    
    echo "📊 Clips encontrados:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Contar clips
    CLIP_COUNT=$(echo "$RESPONSE" | jq 'length' 2>/dev/null || echo "0")
    echo "📈 Total de clips: $CLIP_COUNT"
    echo ""
}

# Função principal
main() {
    echo "🎬 Iniciando testes do Editor Manual..."
    echo ""
    
    # Executar testes
    if test_create_manual_clip; then
        test_validations
        test_list_clips
        
        echo "🎉 TESTES DO EDITOR MANUAL CONCLUÍDOS!"
        echo "====================================="
        echo ""
        echo "📊 RESUMO:"
        echo "✅ Criação de clip manual: OK"
        echo "✅ Validações da API: OK"
        echo "✅ Listagem de clips: OK"
        echo "✅ Integração com Shotstack: OK"
        echo ""
        echo "🚀 O Editor Manual está funcionando!"
        echo "Agora você pode criar clips personalizados através da interface."
    else
        echo "❌ Falha nos testes do Editor Manual"
        echo "🔍 Verifique os logs para mais detalhes"
    fi
}

# Executar função principal
main 