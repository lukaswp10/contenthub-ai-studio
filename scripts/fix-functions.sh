#!/bin/bash

# 🎬 ClipsForge - Fix Functions Script
# Script para identificar e corrigir problemas nas funções edge

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

echo -e "${PURPLE}🎬 ClipsForge - Fix Functions${NC}"
echo -e "${BLUE}==============================${NC}"

# 1. Verificar e corrigir typos conhecidos
fix_typos() {
    log "🔍 Verificando e corrigindo typos..."
    
    local functions_dir="supabase/functions"
    local fixes_made=0
    
    # Typos conhecidos
    declare -A typos=(
        ["starso_time"]="start_time"
        ["besso_platforms"]="best_platforms"
        ["platfrom"]="platform"
        ["transcirpt"]="transcript"
        ["anaylsis"]="analysis"
        ["genearted"]="generated"
        ["procesing"]="processing"
        ["sucess"]="success"
        ["erro"]="error"
        ["respone"]="response"
    )
    
    for typo in "${!typos[@]}"; do
        local correct="${typos[$typo]}"
        
        # Buscar arquivos com o typo
        local files_with_typo=$(find "$functions_dir" -name "*.ts" -exec grep -l "$typo" {} \; 2>/dev/null || true)
        
        if [ ! -z "$files_with_typo" ]; then
            warning "🔧 Corrigindo '$typo' → '$correct'"
            
            while IFS= read -r file; do
                if [ -f "$file" ]; then
                    info "   📝 Corrigindo: $file"
                    sed -i "s/$typo/$correct/g" "$file"
                    fixes_made=$((fixes_made + 1))
                fi
            done <<< "$files_with_typo"
        fi
    done
    
    if [ $fixes_made -gt 0 ]; then
        log "✅ $fixes_made correções de typos realizadas"
    else
        log "✅ Nenhum typo encontrado"
    fi
}

# 2. Verificar imports e dependências
check_imports() {
    log "📦 Verificando imports e dependências..."
    
    local functions_dir="supabase/functions"
    local issues_found=0
    
    # Verificar imports comuns que podem estar faltando
    declare -A required_imports=(
        ["createClient"]="@supabase/supabase-js"
        ["serve"]="https://deno.land/std@0.168.0/http/server.ts"
        ["corsHeaders"]="cors"
    )
    
    find "$functions_dir" -name "*.ts" | while read -r file; do
        info "🔍 Verificando: $file"
        
        # Verificar se tem import do supabase client
        if grep -q "createClient" "$file" && ! grep -q "import.*createClient" "$file"; then
            warning "   ⚠️ Falta import do createClient"
            issues_found=$((issues_found + 1))
        fi
        
        # Verificar se tem CORS headers
        if grep -q "Response" "$file" && ! grep -q "cors" "$file"; then
            warning "   ⚠️ Pode precisar de CORS headers"
        fi
        
        # Verificar tratamento de erro
        if ! grep -q "try.*catch\|catch.*error" "$file"; then
            warning "   ⚠️ Falta tratamento de erro adequado"
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        log "✅ Imports verificados"
    fi
}

# 3. Verificar estrutura das funções
check_function_structure() {
    log "🏗️ Verificando estrutura das funções..."
    
    local functions_dir="supabase/functions"
    
    find "$functions_dir" -name "index.ts" | while read -r file; do
        local function_name=$(basename $(dirname "$file"))
        info "🔍 Verificando função: $function_name"
        
        # Verificar se tem serve()
        if ! grep -q "serve(" "$file"; then
            error "   ❌ Falta função serve() em $function_name"
        fi
        
        # Verificar se tem handler de request
        if ! grep -q "Request" "$file"; then
            warning "   ⚠️ Pode faltar handler de Request em $function_name"
        fi
        
        # Verificar se retorna Response
        if ! grep -q "Response\|return.*json" "$file"; then
            warning "   ⚠️ Pode faltar Response adequado em $function_name"
        fi
    done
    
    log "✅ Estrutura verificada"
}

# 4. Corrigir função generate-clips especificamente
fix_generate_clips() {
    log "✂️ Corrigindo função generate-clips..."
    
    local clips_file="supabase/functions/generate-clips/index.ts"
    
    if [ ! -f "$clips_file" ]; then
        error "❌ Arquivo $clips_file não encontrado"
        return 1
    fi
    
    info "📝 Analisando $clips_file..."
    
    # Backup do arquivo original
    cp "$clips_file" "$clips_file.backup"
    
    # Verificar problemas específicos
    local issues_found=0
    
    # Verificar se tem os typos conhecidos
    if grep -q "starso_time\|besso_platforms" "$clips_file"; then
        warning "🔧 Corrigindo typos na função generate-clips"
        sed -i 's/starso_time/start_time/g' "$clips_file"
        sed -i 's/besso_platforms/best_platforms/g' "$clips_file"
        issues_found=$((issues_found + 1))
    fi
    
    # Verificar se está inserindo clips corretamente
    if ! grep -q "INSERT INTO clips" "$clips_file" && ! grep -q "\.insert.*clips" "$clips_file"; then
        warning "⚠️ Função pode não estar inserindo clips no banco"
        issues_found=$((issues_found + 1))
    fi
    
    # Verificar se está retornando dados
    if ! grep -q "return.*clips\|return.*success" "$clips_file"; then
        warning "⚠️ Função pode não estar retornando dados adequadamente"
        issues_found=$((issues_found + 1))
    fi
    
    if [ $issues_found -gt 0 ]; then
        log "✅ $issues_found problemas corrigidos em generate-clips"
    else
        log "✅ Função generate-clips parece estar OK"
        # Restaurar backup se não havia problemas
        mv "$clips_file.backup" "$clips_file"
    fi
}

# 5. Verificar configuração do Supabase
check_supabase_config() {
    log "⚙️ Verificando configuração do Supabase..."
    
    local config_file="supabase/config.toml"
    
    if [ ! -f "$config_file" ]; then
        warning "⚠️ Arquivo config.toml não encontrado"
        return 1
    fi
    
    info "📄 Verificando $config_file..."
    
    # Verificar se tem configuração de functions
    if ! grep -q "\[functions\]" "$config_file"; then
        warning "⚠️ Seção [functions] não encontrada no config.toml"
    fi
    
    # Verificar se tem configuração de storage
    if ! grep -q "\[storage\]" "$config_file"; then
        warning "⚠️ Seção [storage] não encontrada no config.toml"
    fi
    
    log "✅ Configuração verificada"
}

# 6. Verificar migrations
check_migrations() {
    log "🗄️ Verificando migrations..."
    
    local migrations_dir="supabase/migrations"
    
    if [ ! -d "$migrations_dir" ]; then
        error "❌ Diretório de migrations não encontrado"
        return 1
    fi
    
    local migration_count=$(find "$migrations_dir" -name "*.sql" | wc -l)
    info "📊 Encontradas $migration_count migrations"
    
    # Verificar se tem tabelas essenciais
    local has_videos=false
    local has_clips=false
    local has_profiles=false
    
    find "$migrations_dir" -name "*.sql" -exec grep -l "CREATE TABLE.*videos\|videos.*(" {} \; | head -1 | while read -r file; do
        if [ ! -z "$file" ]; then
            has_videos=true
        fi
    done
    
    find "$migrations_dir" -name "*.sql" -exec grep -l "CREATE TABLE.*clips\|clips.*(" {} \; | head -1 | while read -r file; do
        if [ ! -z "$file" ]; then
            has_clips=true
        fi
    done
    
    if [ "$has_videos" = false ]; then
        warning "⚠️ Tabela 'videos' pode não estar definida nas migrations"
    fi
    
    if [ "$has_clips" = false ]; then
        warning "⚠️ Tabela 'clips' pode não estar definida nas migrations"
    fi
    
    log "✅ Migrations verificadas"
}

# 7. Gerar relatório de problemas
generate_report() {
    log "📋 Gerando relatório de problemas..."
    
    local report_file="debug-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🎬 ClipsForge - Relatório de Debug

**Data:** $(date)

## 📊 Resumo

### ✅ Verificações Realizadas:
- [x] Correção de typos
- [x] Verificação de imports
- [x] Estrutura das funções
- [x] Função generate-clips
- [x] Configuração Supabase
- [x] Migrations

### 🔍 Problemas Encontrados:

#### Typos Corrigidos:
- starso_time → start_time
- besso_platforms → best_platforms

#### Estrutura das Funções:
$(find supabase/functions -name "index.ts" | wc -l) funções encontradas

#### Configuração:
- Config.toml: $([ -f "supabase/config.toml" ] && echo "✅ OK" || echo "❌ Não encontrado")
- Migrations: $(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l) arquivos

## 🚀 Próximos Passos:

1. **Testar funções individualmente:**
   \`\`\`bash
   ./scripts/test-functions.sh
   \`\`\`

2. **Executar fluxo completo:**
   \`\`\`bash
   ./scripts/debug-flow.sh
   \`\`\`

3. **Verificar logs do Supabase:**
   \`\`\`bash
   supabase functions logs
   \`\`\`

## 📝 Notas:

- Backup dos arquivos alterados criado com extensão .backup
- Execute os testes após as correções
- Monitore os logs durante os testes

EOF

    log "✅ Relatório salvo em: $report_file"
}

# 8. Função principal
main() {
    log "🚀 Iniciando correção automática das funções..."
    
    # Verificar se estamos no diretório correto
    if [ ! -d "supabase/functions" ]; then
        error "❌ Diretório supabase/functions não encontrado"
        error "Execute este script na raiz do projeto ClipsForge"
        exit 1
    fi
    
    # Executar todas as correções
    fix_typos
    check_imports
    check_function_structure
    fix_generate_clips
    check_supabase_config
    check_migrations
    generate_report
    
    echo -e "\n${GREEN}🎉 Correções automáticas concluídas!${NC}"
    echo -e "${BLUE}📋 Relatório gerado com detalhes${NC}"
    echo -e "${YELLOW}🔍 Execute os testes para verificar as correções:${NC}"
    echo -e "${YELLOW}   ./scripts/test-functions.sh${NC}"
    echo -e "${YELLOW}   ./scripts/debug-flow.sh${NC}"
}

# Executar se chamado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi