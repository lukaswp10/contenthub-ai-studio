#!/bin/bash

# 🎯 SCRIPT DE TESTE AUTOMATIZADO - ETAPAS 7 & 8
# Sistema completo de validação para marcadores e grupos

set -e

echo "🚀 INICIANDO TESTES AUTOMATIZADOS - ClipsForge ETAPAS 7 & 8"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log com cores
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado. Instale npm primeiro."
    exit 1
fi

log_info "Verificando dependências..."

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências..."
    npm install
fi

# Verificar se o Playwright está instalado
if ! npm list @playwright/test &> /dev/null; then
    log_error "Playwright não encontrado. Execute: npm install --save-dev @playwright/test"
    exit 1
fi

# Instalar browsers do Playwright se necessário
log_info "Verificando browsers do Playwright..."
npx playwright install --with-deps

echo ""
echo "🔧 FASE 1: TESTES UNITÁRIOS"
echo "=========================="

log_info "Executando testes unitários com Vitest..."
if npm run test:run; then
    log_success "Testes unitários passaram!"
else
    log_error "Testes unitários falharam!"
    exit 1
fi

echo ""
echo "🏗️ FASE 2: BUILD E VERIFICAÇÃO"
echo "=============================="

log_info "Verificando TypeScript..."
if npm run type-check; then
    log_success "TypeScript OK!"
else
    log_error "Erros de TypeScript encontrados!"
    exit 1
fi

log_info "Executando build..."
if npm run build; then
    log_success "Build concluído com sucesso!"
else
    log_error "Build falhou!"
    exit 1
fi

echo ""
echo "📚 FASE 3: STORYBOOK"
echo "===================="

log_info "Iniciando Storybook..."

# Iniciar Storybook em background
npm run storybook &
STORYBOOK_PID=$!

# Aguardar Storybook inicializar
log_info "Aguardando Storybook inicializar..."
sleep 15

# Verificar se Storybook está rodando
if curl -s http://localhost:6006 > /dev/null; then
    log_success "Storybook está rodando na porta 6006!"
else
    log_error "Storybook não conseguiu inicializar!"
    kill $STORYBOOK_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎭 FASE 4: TESTES E2E COM PLAYWRIGHT"
echo "===================================="

log_info "Executando testes End-to-End..."

# Executar testes do Playwright
if npx playwright test; then
    log_success "Todos os testes E2E passaram!"
    
    # Gerar relatório
    log_info "Gerando relatório de testes..."
    npx playwright show-report --host 0.0.0.0 &
    REPORT_PID=$!
    
    echo ""
    log_success "Relatório disponível em: http://localhost:9323"
    
else
    log_error "Alguns testes E2E falharam!"
    
    # Mostrar relatório mesmo com falhas
    log_info "Gerando relatório de falhas..."
    npx playwright show-report --host 0.0.0.0 &
    REPORT_PID=$!
    
    echo ""
    log_warning "Relatório de falhas disponível em: http://localhost:9323"
fi

echo ""
echo "📊 RESUMO DOS TESTES"
echo "==================="

# Contar arquivos de teste
UNIT_TESTS=$(find src -name "*.test.*" -o -name "*.spec.*" | wc -l)
E2E_TESTS=$(find tests -name "*.spec.*" | wc -l)
STORIES=$(find src -name "*.stories.*" | wc -l)

echo "📋 Testes Unitários: $UNIT_TESTS arquivos"
echo "🎭 Testes E2E: $E2E_TESTS arquivos"
echo "📚 Stories: $STORIES arquivos"

echo ""
echo "🌐 SERVIÇOS ATIVOS:"
echo "Storybook: http://localhost:6006"
echo "Relatório Playwright: http://localhost:9323"

echo ""
log_info "Pressione Ctrl+C para parar todos os serviços"

# Função para cleanup
cleanup() {
    echo ""
    log_info "Parando serviços..."
    kill $STORYBOOK_PID 2>/dev/null || true
    kill $REPORT_PID 2>/dev/null || true
    log_success "Serviços parados!"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Aguardar indefinidamente
while true; do
    sleep 1
done 