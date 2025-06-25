#!/bin/bash

# 🎬 ClipsForge - Quick Check Script
# Verificação rápida do status das funções edge

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🎬 ClipsForge - Quick Status Check${NC}"
echo -e "${BLUE}==================================${NC}"

# 1. Verificar estrutura das funções
echo -e "\n${YELLOW}📁 ESTRUTURA DAS FUNÇÕES:${NC}"
if [ -d "supabase/functions" ]; then
    functions_count=$(find supabase/functions -name "index.ts" | wc -l)
    echo -e "${GREEN}✅ Diretório functions encontrado${NC}"
    echo -e "${BLUE}📊 Total de funções: $functions_count${NC}"
    
    # Listar funções
    echo -e "\n${BLUE}📋 Funções encontradas:${NC}"
    find supabase/functions -name "index.ts" | while read -r file; do
        function_name=$(basename $(dirname "$file"))
        file_size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
        echo -e "  ${GREEN}•${NC} $function_name (${file_size} bytes)"
    done
else
    echo -e "${RED}❌ Diretório supabase/functions não encontrado${NC}"
fi

# 2. Verificar problemas conhecidos
echo -e "\n${YELLOW}🔍 VERIFICANDO PROBLEMAS CONHECIDOS:${NC}"

# Verificar typos
typos_found=0
if find supabase/functions -name "*.ts" -exec grep -l "starso_time\|besso_platforms" {} \; 2>/dev/null | head -1 | read -r file; then
    echo -e "${RED}❌ Typos encontrados (starso_time, besso_platforms)${NC}"
    typos_found=1
else
    echo -e "${GREEN}✅ Nenhum typo conhecido encontrado${NC}"
fi

# Verificar imports
imports_ok=true
if ! find supabase/functions -name "*.ts" -exec grep -l "import.*createClient" {} \; 2>/dev/null | head -1 | read -r file; then
    echo -e "${YELLOW}⚠️ Algumas funções podem estar sem import do createClient${NC}"
    imports_ok=false
fi

if [ "$imports_ok" = true ]; then
    echo -e "${GREEN}✅ Imports básicos parecem OK${NC}"
fi

# 3. Verificar função generate-clips especificamente
echo -e "\n${YELLOW}✂️ FUNÇÃO GENERATE-CLIPS:${NC}"
clips_file="supabase/functions/generate-clips/index.ts"
if [ -f "$clips_file" ]; then
    echo -e "${GREEN}✅ Arquivo encontrado${NC}"
    
    # Verificar tamanho
    file_size=$(stat -c%s "$clips_file" 2>/dev/null || stat -f%z "$clips_file" 2>/dev/null || echo "0")
    echo -e "${BLUE}📏 Tamanho: $file_size bytes${NC}"
    
    # Verificar se tem funções essenciais
    if grep -q "serve(" "$clips_file"; then
        echo -e "${GREEN}✅ Função serve() encontrada${NC}"
    else
        echo -e "${RED}❌ Função serve() não encontrada${NC}"
    fi
    
    if grep -q "createClient\|supabase" "$clips_file"; then
        echo -e "${GREEN}✅ Cliente Supabase encontrado${NC}"
    else
        echo -e "${RED}❌ Cliente Supabase não encontrado${NC}"
    fi
    
    if grep -q "clips.*insert\|INSERT INTO clips" "$clips_file"; then
        echo -e "${GREEN}✅ Inserção de clips encontrada${NC}"
    else
        echo -e "${YELLOW}⚠️ Inserção de clips pode estar ausente${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo generate-clips/index.ts não encontrado${NC}"
fi

# 4. Verificar configuração
echo -e "\n${YELLOW}⚙️ CONFIGURAÇÃO:${NC}"
if [ -f "supabase/config.toml" ]; then
    echo -e "${GREEN}✅ config.toml encontrado${NC}"
else
    echo -e "${RED}❌ config.toml não encontrado${NC}"
fi

if [ -f ".env.debug" ]; then
    echo -e "${GREEN}✅ .env.debug encontrado${NC}"
else
    echo -e "${YELLOW}⚠️ .env.debug não encontrado (execute setup-debug.sh)${NC}"
fi

# 5. Verificar migrations
echo -e "\n${YELLOW}🗄️ MIGRATIONS:${NC}"
if [ -d "supabase/migrations" ]; then
    migrations_count=$(find supabase/migrations -name "*.sql" | wc -l)
    echo -e "${GREEN}✅ Diretório migrations encontrado${NC}"
    echo -e "${BLUE}📊 Total de migrations: $migrations_count${NC}"
    
    # Verificar tabelas essenciais
    if find supabase/migrations -name "*.sql" -exec grep -l "CREATE TABLE.*videos\|videos.*(" {} \; | head -1 | read -r file; then
        echo -e "${GREEN}✅ Tabela videos encontrada${NC}"
    else
        echo -e "${YELLOW}⚠️ Tabela videos pode estar ausente${NC}"
    fi
    
    if find supabase/migrations -name "*.sql" -exec grep -l "CREATE TABLE.*clips\|clips.*(" {} \; | head -1 | read -r file; then
        echo -e "${GREEN}✅ Tabela clips encontrada${NC}"
    else
        echo -e "${YELLOW}⚠️ Tabela clips pode estar ausente${NC}"
    fi
else
    echo -e "${RED}❌ Diretório migrations não encontrado${NC}"
fi

# 6. Verificar dependências
echo -e "\n${YELLOW}🔧 DEPENDÊNCIAS:${NC}"
if command -v curl &> /dev/null; then
    echo -e "${GREEN}✅ curl encontrado${NC}"
else
    echo -e "${RED}❌ curl não encontrado${NC}"
fi

if command -v jq &> /dev/null; then
    echo -e "${GREEN}✅ jq encontrado${NC}"
else
    echo -e "${RED}❌ jq não encontrado${NC}"
fi

if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ supabase CLI encontrado${NC}"
else
    echo -e "${YELLOW}⚠️ supabase CLI não encontrado${NC}"
fi

# 7. Resumo e recomendações
echo -e "\n${PURPLE}📋 RESUMO E RECOMENDAÇÕES:${NC}"

if [ $typos_found -eq 1 ]; then
    echo -e "${RED}🔧 AÇÃO NECESSÁRIA: Execute ./scripts/fix-functions.sh${NC}"
fi

if [ ! -f ".env.debug" ]; then
    echo -e "${YELLOW}⚙️ RECOMENDADO: Execute ./scripts/setup-debug.sh${NC}"
fi

if [ ! -f "$clips_file" ]; then
    echo -e "${RED}❌ CRÍTICO: Função generate-clips não encontrada${NC}"
fi

# Verificar se pode fazer testes
can_test=true
if ! command -v curl &> /dev/null || ! command -v jq &> /dev/null; then
    can_test=false
fi

if [ "$can_test" = true ] && [ -f ".env.debug" ]; then
    echo -e "\n${GREEN}🚀 PRONTO PARA TESTES:${NC}"
    echo -e "${BLUE}  ./scripts/test-functions.sh${NC}"
    echo -e "${BLUE}  ./scripts/debug-flow.sh${NC}"
elif [ "$can_test" = true ]; then
    echo -e "\n${YELLOW}⚙️ CONFIGURE PRIMEIRO:${NC}"
    echo -e "${BLUE}  ./scripts/setup-debug.sh${NC}"
else
    echo -e "\n${RED}❌ INSTALE DEPENDÊNCIAS:${NC}"
    echo -e "${BLUE}  sudo apt install curl jq${NC}"
fi

echo -e "\n${GREEN}✨ Verificação concluída!${NC}"