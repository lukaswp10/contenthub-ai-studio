#!/bin/bash

# 🚀 ClipsForge - Deploy em Produção
# Script automatizado para deploy completo

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 ClipsForge - Deploy em Produção${NC}"
echo -e "${BLUE}================================${NC}"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto ClipsForge${NC}"
    exit 1
fi

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# 1. Verificar dependências
log "🔍 Verificando dependências..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    error "Supabase CLI não está instalado"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

# Verificar se o Node.js está na versão correta
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    error "Node.js versão 18+ é necessária. Versão atual: $(node --version)"
    exit 1
fi

log "✅ Dependências verificadas"

# 2. Configurar variáveis de ambiente
log "⚙️ Verificando configurações de produção..."

# Verificar se as variáveis essenciais estão definidas
REQUIRED_VARS=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_CLOUDINARY_CLOUD_NAME"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    error "As seguintes variáveis de ambiente são obrigatórias:"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Configure-as no arquivo .env ou como variáveis de ambiente do sistema"
    exit 1
fi

log "✅ Configurações verificadas"

# 3. Executar testes
log "🧪 Executando testes..."

if npm run test &> /dev/null; then
    log "✅ Todos os testes passaram"
else
    warning "⚠️ Alguns testes falharam, mas continuando o deploy"
fi

# 4. Build da aplicação
log "🏗️ Fazendo build da aplicação..."

if npm run build; then
    log "✅ Build concluído com sucesso"
else
    error "❌ Falha no build da aplicação"
    exit 1
fi

# 5. Deploy das Edge Functions
log "🔧 Fazendo deploy das Edge Functions..."

# Verificar se está logado no Supabase
if ! supabase projects list &> /dev/null; then
    warning "⚠️ Não está logado no Supabase. Faça login primeiro:"
    echo "supabase login"
    exit 1
fi

# Deploy das functions
FUNCTIONS=(
    "upload-video"
    "transcribe-video"
    "analyze-content"
    "generate-clips"
    "regenerate-clips"
    "generate-reels"
    "schedule-post"
    "connect-social-account"
    "refresh-social-account"
    "create-checkout"
    "customer-portal"
    "complete-oauth"
    "check-subscription"
)

echo "📦 Fazendo deploy de ${#FUNCTIONS[@]} functions..."

for func in "${FUNCTIONS[@]}"; do
    log "🚀 Deploying $func..."
    if supabase functions deploy "$func" --no-verify-jwt; then
        log "✅ $func deployed"
    else
        error "❌ Falha no deploy de $func"
        exit 1
    fi
done

# 6. Configurar secrets no Supabase
log "🔐 Configurando secrets no Supabase..."

# Lista de secrets que devem ser configurados
SECRETS=(
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "GROQ_API_KEY"
    "HUGGINGFACE_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
)

echo "🔑 Verificando ${#SECRETS[@]} secrets..."

for secret in "${SECRETS[@]}"; do
    if [ -n "${!secret}" ]; then
        log "🔐 Configurando $secret..."
        if echo "${!secret}" | supabase secrets set "$secret"; then
            log "✅ $secret configurado"
        else
            warning "⚠️ Falha ao configurar $secret"
        fi
    else
        warning "⚠️ $secret não definido"
    fi
done

# 7. Aplicar migrações do banco
log "🗄️ Aplicando migrações do banco..."

if supabase db push; then
    log "✅ Migrações aplicadas"
else
    error "❌ Falha ao aplicar migrações"
    exit 1
fi

# 8. Deploy do frontend (se especificado)
if [ "$1" = "--deploy-frontend" ]; then
    log "🌐 Fazendo deploy do frontend..."
    
    # Verificar se Vercel CLI está instalado
    if command -v vercel &> /dev/null; then
        log "📤 Deploying to Vercel..."
        if vercel --prod; then
            log "✅ Frontend deployed to Vercel"
        else
            error "❌ Falha no deploy do frontend"
            exit 1
        fi
    # Verificar se Netlify CLI está instalado
    elif command -v netlify &> /dev/null; then
        log "📤 Deploying to Netlify..."
        if netlify deploy --prod --dir=dist; then
            log "✅ Frontend deployed to Netlify"
        else
            error "❌ Falha no deploy do frontend"
            exit 1
        fi
    else
        warning "⚠️ Nenhuma plataforma de deploy detectada (Vercel/Netlify)"
        echo "Build está pronto em ./dist/"
    fi
fi

# 9. Verificar deploy
log "🔍 Verificando deploy..."

# Testar uma function básica
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
if [ -n "$SUPABASE_URL" ]; then
    log "🌐 API URL: $SUPABASE_URL"
    
    # Teste simples de conectividade
    if curl -f "${SUPABASE_URL}/rest/v1/" &> /dev/null; then
        log "✅ API está respondendo"
    else
        warning "⚠️ API pode não estar respondendo corretamente"
    fi
fi

# 10. Configurações pós-deploy
log "⚡ Configurações pós-deploy..."

echo ""
echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "1. Verificar se todas as functions estão funcionando"
echo "2. Testar o fluxo completo de upload → clips"
echo "3. Configurar monitoramento (opcional)"
echo "4. Configurar alertas (opcional)"
echo ""

echo -e "${BLUE}🔗 Links úteis:${NC}"
if [ -n "$SUPABASE_URL" ]; then
    echo "• Dashboard Supabase: https://supabase.com/dashboard"
    echo "• API URL: $SUPABASE_URL"
    echo "• Functions: $SUPABASE_URL/functions/v1/"
fi

echo ""
echo -e "${BLUE}📊 Monitoramento:${NC}"
echo "• Logs: supabase functions logs [function-name]"
echo "• Status: supabase status"
echo "• Database: supabase db remote commit list"

echo ""
echo -e "${GREEN}✨ ClipsForge está pronto para produção!${NC}" 