#!/bin/bash

# ====================================
# TESTE DO NOVO FLUXO CLIPSFORGE
# Localização: scripts/test-new-flow.sh
# ====================================

# Cores para melhor visualização
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 TESTANDO NOVO FLUXO CLIPSFORGE"
echo "=================================="

# Função para testar endpoint
test_endpoint() {
    local url=$1
    local description=$2
    echo -e "${BLUE}🔍 Testando: $description${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 404 ]; then
        echo -e "${GREEN}✅ $description - OK (HTTP $response)${NC}"
    else
        echo -e "${RED}❌ $description - ERRO (HTTP $response)${NC}"
    fi
    echo ""
}

# Testa se o Supabase local está rodando
echo -e "${YELLOW}📡 Verificando Supabase local...${NC}"
test_endpoint "http://127.0.0.1:54321/rest/v1/" "Supabase REST API"
test_endpoint "http://127.0.0.1:54323" "Supabase Studio"

# Testa se o frontend está rodando
echo -e "${YELLOW}🌐 Verificando Frontend...${NC}"
test_endpoint "http://localhost:8080" "Frontend ClipsForge"

# Testa edge functions principais
echo -e "${YELLOW}⚡ Testando Edge Functions...${NC}"
test_endpoint "http://127.0.0.1:54321/functions/v1/upload-video" "Upload Video Function"
test_endpoint "http://127.0.0.1:54321/functions/v1/analyze-content" "Analyze Content Function"
test_endpoint "http://127.0.0.1:54321/functions/v1/generate-clips" "Generate Clips Function"

# Verifica se os testes estão passando
echo -e "${YELLOW}🧪 Executando testes automatizados...${NC}"
npm test

echo ""
echo -e "${GREEN}🎉 TESTE COMPLETO DO CLIPSFORGE FINALIZADO!${NC}"
echo -e "${BLUE}📊 Resumo dos serviços:${NC}"
echo "• Frontend: http://localhost:8080"
echo "• Supabase Studio: http://127.0.0.1:54323"
echo "• API: http://127.0.0.1:54321"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "1. Faça login no sistema"
echo "2. Faça upload de um vídeo de teste"
echo "3. Acompanhe o processamento no dashboard" 