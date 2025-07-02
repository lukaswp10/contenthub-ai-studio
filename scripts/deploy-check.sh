#!/bin/bash

echo "🔍 ClipsForge - Verificador de Deploy"
echo "====================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Verificando status do Vercel...${NC}"

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI não encontrado${NC}"
    echo -e "${YELLOW}💡 Instale com: npm i -g vercel${NC}"
    exit 1
fi

# Verificar login
echo -e "${BLUE}🔐 Verificando login...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Não está logado no Vercel${NC}"
    echo -e "${YELLOW}💡 Execute: vercel login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Login OK${NC}"

# Verificar projetos
echo -e "${BLUE}📁 Verificando projetos...${NC}"
vercel ls 2>/dev/null | head -5

# Tentar deploy de teste (dry run)
echo -e "${BLUE}🚀 Testando deploy...${NC}"
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 DEPLOY REALIZADO COM SUCESSO!${NC}"
    echo "$DEPLOY_OUTPUT" | grep -E "(https://|Preview:|Production:)"
else
    echo -e "${RED}❌ ERRO NO DEPLOY${NC}"
    
    # Verificar tipos específicos de erro
    if echo "$DEPLOY_OUTPUT" | grep -q "api-deployments-free-per-day"; then
        echo -e "${YELLOW}🚨 LIMITE DE DEPLOY ATINGIDO!${NC}"
        echo -e "${YELLOW}📊 Vercel Free: 100 deploys/dia${NC}"
        echo -e "${YELLOW}⏰ Aguarde o reset ou upgrade para Pro${NC}"
        
        # Extrair tempo de espera se disponível
        if echo "$DEPLOY_OUTPUT" | grep -q "try again in"; then
            WAIT_TIME=$(echo "$DEPLOY_OUTPUT" | grep -o "try again in [0-9]* minutes" | head -1)
            echo -e "${YELLOW}⏱️  $WAIT_TIME${NC}"
        fi
    elif echo "$DEPLOY_OUTPUT" | grep -q "build failed"; then
        echo -e "${RED}🔨 ERRO DE BUILD${NC}"
        echo -e "${YELLOW}💡 Verifique os logs de build${NC}"
    elif echo "$DEPLOY_OUTPUT" | grep -q "not found"; then
        echo -e "${RED}🔗 PROJETO NÃO CONECTADO${NC}"
        echo -e "${YELLOW}💡 Execute: vercel link${NC}"
    else
        echo -e "${RED}🤔 ERRO DESCONHECIDO:${NC}"
        echo "$DEPLOY_OUTPUT" | head -10
    fi
    
    exit 1
fi 