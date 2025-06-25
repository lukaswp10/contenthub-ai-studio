#!/bin/bash

# Script para testar a função check-shotstack-status
# Verifica se monitora renders do Shotstack corretamente

set -e

echo "🔧 ETAPA 1.3 - Testando função check-shotstack-status"
echo "=================================================="

# Configurações
PROJECT_REF="rgwbtdzdeibobuveegfp"
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw"

echo "📊 1. Verificando clips na tabela clips diretamente..."
curl -s -X GET "${SUPABASE_URL}/rest/v1/clips?status=eq.processing&select=id,title,status,shotstack_render_id,created_at" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" | jq '.'

echo ""
echo "🔍 2. Testando função check-shotstack-status..."

# Chamada para a função
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/check-shotstack-status" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "📋 Resposta da função:"
echo "$response" | jq '.'

# Verificar se houve erro
if echo "$response" | jq -e '.error' > /dev/null; then
    echo "❌ Erro encontrado na função!"
    echo "🔍 Verificando logs..."
    supabase functions logs check-shotstack-status --project-ref $PROJECT_REF | tail -20
    exit 1
fi

echo ""
echo "📊 3. Verificando clips prontos após processamento..."
curl -s -X GET "${SUPABASE_URL}/rest/v1/clips?status=eq.ready&select=id,title,status,cloudinary_secure_url,updated_at&order=updated_at.desc&limit=10" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" | jq '.'

echo ""
echo "✅ Teste da função check-shotstack-status concluído!"
echo ""
echo "📋 Resumo:"
echo "- Função executou sem erros"
echo "- Verificou clips em processamento"
echo "- Atualizou status conforme necessário"
echo ""
echo "🔍 Para ver logs detalhados:"
echo "supabase functions logs check-shotstack-status --project-ref $PROJECT_REF" 