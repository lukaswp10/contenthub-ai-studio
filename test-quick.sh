#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTgzODUsImV4cCI6MjA2ODI5NDM4NX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"

echo -e "${CYAN}=== TESTE RÁPIDO DAS FUNÇÕES ===${NC}"
echo ""

# Teste 1: Verificar se as funções estão acessíveis
echo -e "${BLUE}1. Testando acessibilidade das funções...${NC}"

functions=("upload-video" "transcribe-video" "analyze-content" "generate-clips")

for func in "${functions[@]}"; do
    echo -n "  - $func: "
    response=$(curl -s -o /dev/null -w "%{http_code}" "${SUPABASE_URL}/functions/v1/${func}")
    if [ "$response" = "401" ] || [ "$response" = "400" ]; then
        echo -e "${GREEN}OK${NC} (HTTP $response - função acessível)"
    else
        echo -e "${YELLOW}Verificar${NC} (HTTP $response)"
    fi
done

echo ""

# Teste 2: Verificar se há vídeos no banco
echo -e "${BLUE}2. Verificando vídeos no banco...${NC}"
response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/videos?select=id,title,processing_status&limit=3" \
    -H "Authorization: Bearer $TOKEN" \
    -H "apikey: $TOKEN")

if echo "$response" | jq -e . >/dev/null 2>&1; then
    count=$(echo "$response" | jq '. | length')
    echo -e "  ${GREEN}Encontrados $count vídeos${NC}"
    
    if [ "$count" -gt 0 ]; then
        echo "  Últimos vídeos:"
        echo "$response" | jq -r '.[] | "    - \(.title) (\(.processing_status))"'
    fi
else
    echo -e "  ${RED}Erro ao acessar banco de dados${NC}"
    echo "  Response: $response"
fi

echo ""

# Teste 3: Verificar configurações do Cloudinary
echo -e "${BLUE}3. Verificando configuração do Cloudinary...${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/upload-video" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"test": true}')

if echo "$response" | jq -e . >/dev/null 2>&1; then
    error=$(echo "$response" | jq -r '.error // "none"')
    if [ "$error" != "none" ]; then
        if [[ "$error" == *"Cloudinary"* ]]; then
            echo -e "  ${YELLOW}Problema com Cloudinary: $error${NC}"
        else
            echo -e "  ${GREEN}Cloudinary configurado${NC} (erro esperado: $error)"
        fi
    else
        echo -e "  ${GREEN}Cloudinary funcionando${NC}"
    fi
else
    echo -e "  ${RED}Erro na resposta da função${NC}"
fi

echo ""

# Teste 4: Verificar chave Groq
echo -e "${BLUE}4. Verificando chave Groq...${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/analyze-content" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"test": true}')

if echo "$response" | jq -e . >/dev/null 2>&1; then
    error=$(echo "$response" | jq -r '.error // "none"')
    if [ "$error" != "none" ]; then
        if [[ "$error" == *"API key"* ]] || [[ "$error" == *"Groq"* ]]; then
            echo -e "  ${YELLOW}Problema com chave Groq: $error${NC}"
        else
            echo -e "  ${GREEN}Groq configurado${NC} (erro esperado: $error)"
        fi
    else
        echo -e "  ${GREEN}Groq funcionando${NC}"
    fi
else
    echo -e "  ${RED}Erro na resposta da função${NC}"
fi

echo ""

# Teste 5: Verificar Hugging Face
echo -e "${BLUE}5. Verificando Hugging Face...${NC}"
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/transcribe-video" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"test": true}')

if echo "$response" | jq -e . >/dev/null 2>&1; then
    error=$(echo "$response" | jq -r '.error // "none"')
    if [ "$error" != "none" ]; then
        if [[ "$error" == *"API"* ]] || [[ "$error" == *"Hugging"* ]]; then
            echo -e "  ${YELLOW}Problema com Hugging Face: $error${NC}"
        else
            echo -e "  ${GREEN}Hugging Face configurado${NC} (erro esperado: $error)"
        fi
    else
        echo -e "  ${GREEN}Hugging Face funcionando${NC}"
    fi
else
    echo -e "  ${RED}Erro na resposta da função${NC}"
fi

echo ""
echo -e "${CYAN}=== RESUMO ===${NC}"
echo "Para testar o pipeline completo, execute:"
echo -e "  ${GREEN}./test-pipeline-interactive.sh${NC}"
echo ""
echo "Para ver logs em tempo real:"
echo -e "  ${GREEN}supabase functions logs --follow${NC}"
echo ""
echo "Para verificar status das funções:"
echo -e "  ${GREEN}supabase functions list${NC}" 