#!/bin/bash

# 🧪 ClipsForge E2E Tests - Production Runner
# Executa testes E2E funcionais contra a aplicação em produção

set -e

echo "🚀 CLIPSFORGE E2E TESTS - PRODUCTION MODE"
echo "========================================="
echo ""

# Verificar se Playwright está instalado
if ! command -v npx playwright &> /dev/null; then
    echo "❌ Playwright não encontrado. Instalando..."
    npm install -D @playwright/test
    npx playwright install
fi

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Testando aplicação em produção: https://clipsforge.vercel.app${NC}"
echo ""

# Verificar se a aplicação está online
echo -e "${BLUE}🔍 Verificando se a aplicação está online...${NC}"
if curl -s -I https://clipsforge.vercel.app | grep -q "200"; then
    echo -e "${GREEN}✅ Aplicação online e respondendo${NC}"
else
    echo -e "${RED}❌ Aplicação não está respondendo${NC}"
    echo -e "${YELLOW}💡 Verifique se https://clipsforge.vercel.app está funcionando${NC}"
    exit 1
fi

echo ""

# Executar testes específicos
echo -e "${BLUE}🧪 Executando testes E2E em produção...${NC}"
echo ""

# Teste 1: Upload de vídeo
echo -e "${YELLOW}📤 Teste 1: Upload de vídeo${NC}"
if npx playwright test tests/e2e/specs/01-upload.spec.ts --project=chromium; then
    echo -e "${GREEN}✅ Upload test passou${NC}"
else
    echo -e "${RED}❌ Upload test falhou${NC}"
fi

echo ""

# Teste 2: Interface do editor
echo -e "${YELLOW}🎬 Teste 2: Interface do editor${NC}"
if npx playwright test tests/e2e/specs/02-editor-ui.spec.ts --project=chromium; then
    echo -e "${GREEN}✅ Editor UI test passou${NC}"
else
    echo -e "${RED}❌ Editor UI test falhou${NC}"
fi

echo ""

# Teste 3: Timeline
echo -e "${YELLOW}⏱️ Teste 3: Timeline${NC}"
if npx playwright test tests/e2e/specs/03-timeline.spec.ts --project=chromium; then
    echo -e "${GREEN}✅ Timeline test passou${NC}"
else
    echo -e "${RED}❌ Timeline test falhou${NC}"
fi

echo ""

# Teste 4: Playback
echo -e "${YELLOW}▶️ Teste 4: Playback${NC}"
if npx playwright test tests/e2e/specs/04-playback.spec.ts --project=chromium; then
    echo -e "${GREEN}✅ Playback test passou${NC}"
else
    echo -e "${RED}❌ Playback test falhou${NC}"
fi

echo ""

# Teste 5: Export
echo -e "${YELLOW}📥 Teste 5: Export${NC}"
if npx playwright test tests/e2e/specs/05-export.spec.ts --project=chromium; then
    echo -e "${GREEN}✅ Export test passou${NC}"
else
    echo -e "${RED}❌ Export test falhou${NC}"
fi

echo ""

# Teste 6: Integração completa
echo -e "${YELLOW}🔗 Teste 6: Integração completa${NC}"
if npx playwright test tests/e2e/specs/06-integration.spec.ts --project=chromium; then
    echo -e "${GREEN}✅ Integration test passou${NC}"
else
    echo -e "${RED}❌ Integration test falhou${NC}"
fi

echo ""

# Gerar relatório
echo -e "${BLUE}📊 Gerando relatório...${NC}"
npx playwright show-report --host 0.0.0.0 --port 9323 &

echo ""
echo -e "${GREEN}🎉 TESTES E2E CONCLUÍDOS!${NC}"
echo -e "${BLUE}📊 Relatório disponível em: http://localhost:9323${NC}"
echo ""
echo -e "${YELLOW}💡 Para rodar todos os testes novamente:${NC}"
echo -e "${YELLOW}   npm run test:e2e${NC}"
echo ""
echo -e "${YELLOW}💡 Para rodar um teste específico:${NC}"
echo -e "${YELLOW}   npx playwright test tests/e2e/specs/01-upload.spec.ts${NC}"
echo "" 