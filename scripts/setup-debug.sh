#!/bin/bash

# 🎬 ClipsForge - Setup Debug Script
# Script para configurar rapidamente o ambiente de debug

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

echo -e "${PURPLE}🎬 ClipsForge - Setup Debug Environment${NC}"
echo -e "${BLUE}=======================================${NC}"

# 1. Verificar dependências
check_dependencies() {
    log "🔍 Verificando dependências..."
    
    local deps_ok=true
    
    # Verificar curl
    if ! command -v curl &> /dev/null; then
        error "❌ curl não está instalado"
        info "   Ubuntu/Debian: sudo apt install curl"
        info "   macOS: brew install curl"
        deps_ok=false
    else
        log "✅ curl encontrado"
    fi
    
    # Verificar jq
    if ! command -v jq &> /dev/null; then
        error "❌ jq não está instalado"
        info "   Ubuntu/Debian: sudo apt install jq"
        info "   macOS: brew install jq"
        deps_ok=false
    else
        log "✅ jq encontrado"
    fi
    
    # Verificar supabase CLI
    if ! command -v supabase &> /dev/null; then
        warning "⚠️ Supabase CLI não está instalado"
        info "   Instale com: npm install -g supabase"
        info "   Ou veja: https://supabase.com/docs/guides/cli"
    else
        log "✅ Supabase CLI encontrado"
    fi
    
    if [ "$deps_ok" = false ]; then
        error "❌ Instale as dependências faltantes antes de continuar"
        exit 1
    fi
}

# 2. Configurar variáveis do Supabase
setup_supabase_config() {
    log "⚙️ Configurando variáveis do Supabase..."
    
    local env_file=".env.debug"
    
    if [ -f "$env_file" ]; then
        warning "⚠️ Arquivo $env_file já existe"
        read -p "Deseja sobrescrever? (y/N): " -r overwrite
        if [[ ! $overwrite =~ ^[Yy]$ ]]; then
            log "✅ Mantendo configuração existente"
            return 0
        fi
    fi
    
    echo -e "${YELLOW}🔧 Configure suas variáveis do Supabase:${NC}"
    
    # Supabase URL
    read -p "Supabase URL (ex: https://xxx.supabase.co): " -r supabase_url
    if [ -z "$supabase_url" ]; then
        supabase_url="https://your-project.supabase.co"
    fi
    
    # Anon Key
    read -p "Supabase Anon Key: " -r anon_key
    if [ -z "$anon_key" ]; then
        anon_key="your-anon-key"
    fi
    
    # Service Key
    read -p "Supabase Service Key: " -r service_key
    if [ -z "$service_key" ]; then
        service_key="your-service-key"
    fi
    
    # Criar arquivo de configuração
    cat > "$env_file" << EOF
# 🎬 ClipsForge - Debug Configuration
# Configurações para debugging

# Supabase
SUPABASE_URL="$supabase_url"
SUPABASE_ANON_KEY="$anon_key"
SUPABASE_SERVICE_KEY="$service_key"

# Debug
DEBUG_USER_EMAIL="debug@clipsforge.com"
DEBUG_USER_PASSWORD="debug123456"
DEBUG_VIDEO_PATH="test-video.mp4"

# URLs
BASE_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:5173"

EOF
    
    log "✅ Configuração salva em $env_file"
}

# 3. Atualizar scripts com configurações
update_scripts() {
    log "📝 Atualizando scripts com configurações..."
    
    local env_file=".env.debug"
    
    if [ ! -f "$env_file" ]; then
        error "❌ Arquivo $env_file não encontrado"
        return 1
    fi
    
    # Carregar variáveis
    source "$env_file"
    
    # Atualizar debug-flow.sh
    if [ -f "scripts/debug-flow.sh" ]; then
        info "📝 Atualizando debug-flow.sh..."
        sed -i "s|SUPABASE_URL=\".*\"|SUPABASE_URL=\"$SUPABASE_URL\"|g" scripts/debug-flow.sh
        sed -i "s|SUPABASE_ANON_KEY=\".*\"|SUPABASE_ANON_KEY=\"$SUPABASE_ANON_KEY\"|g" scripts/debug-flow.sh
        sed -i "s|SUPABASE_SERVICE_KEY=\".*\"|SUPABASE_SERVICE_KEY=\"$SUPABASE_SERVICE_KEY\"|g" scripts/debug-flow.sh
    fi
    
    # Atualizar test-functions.sh
    if [ -f "scripts/test-functions.sh" ]; then
        info "📝 Atualizando test-functions.sh..."
        sed -i "s|SUPABASE_URL=\".*\"|SUPABASE_URL=\"$SUPABASE_URL\"|g" scripts/test-functions.sh
        sed -i "s|SUPABASE_ANON_KEY=\".*\"|SUPABASE_ANON_KEY=\"$SUPABASE_ANON_KEY\"|g" scripts/test-functions.sh
        sed -i "s|SUPABASE_SERVICE_KEY=\".*\"|SUPABASE_SERVICE_KEY=\"$SUPABASE_SERVICE_KEY\"|g" scripts/test-functions.sh
    fi
    
    log "✅ Scripts atualizados"
}

# 4. Criar arquivo de vídeo de teste
create_test_video() {
    log "🎥 Criando arquivo de vídeo de teste..."
    
    local test_file="test-video.mp4"
    
    if [ -f "$test_file" ]; then
        log "✅ Arquivo de teste já existe: $test_file"
        return 0
    fi
    
    # Criar arquivo fake para teste
    info "📁 Criando arquivo fake para teste..."
    cat > "$test_file" << 'EOF'
FAKE VIDEO CONTENT FOR TESTING
This is a mock video file used for debugging the ClipsForge upload flow.
In a real scenario, this would be a proper MP4 video file.
Duration: 60 seconds (simulated)
Content: Technology and AI discussion
EOF
    
    log "✅ Arquivo de teste criado: $test_file"
}

# 5. Tornar scripts executáveis
make_scripts_executable() {
    log "🔧 Tornando scripts executáveis..."
    
    local scripts=(
        "scripts/debug-flow.sh"
        "scripts/test-functions.sh"
        "scripts/fix-functions.sh"
        "scripts/setup-debug.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            info "✅ $script agora é executável"
        else
            warning "⚠️ $script não encontrado"
        fi
    done
}

# 6. Verificar estrutura do projeto
verify_project_structure() {
    log "🏗️ Verificando estrutura do projeto..."
    
    local required_dirs=(
        "supabase/functions"
        "supabase/migrations"
        "src/pages"
        "scripts"
    )
    
    local structure_ok=true
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log "✅ $dir encontrado"
        else
            error "❌ $dir não encontrado"
            structure_ok=false
        fi
    done
    
    if [ "$structure_ok" = false ]; then
        error "❌ Estrutura do projeto incompleta"
        error "Execute este script na raiz do projeto ClipsForge"
        exit 1
    fi
}

# 7. Gerar guia de uso
generate_usage_guide() {
    log "📚 Gerando guia de uso..."
    
    local guide_file="DEBUG_GUIDE.md"
    
    cat > "$guide_file" << 'EOF'
# 🎬 ClipsForge - Guia de Debug

## 🚀 Como usar os scripts de debug

### 1. **Setup Inicial (já executado)**
```bash
./scripts/setup-debug.sh
```

### 2. **Corrigir Problemas Conhecidos**
```bash
./scripts/fix-functions.sh
```

### 3. **Testar Funções Individualmente**
```bash
./scripts/test-functions.sh
```

### 4. **Testar Fluxo Completo**
```bash
./scripts/debug-flow.sh
```

## 📁 Arquivos Criados

- `.env.debug` - Configurações de debug
- `test-video.mp4` - Arquivo de teste
- `DEBUG_GUIDE.md` - Este guia
- `debug-report-*.md` - Relatórios de debug

## 🔧 Configuração

Edite `.env.debug` com suas credenciais reais do Supabase:

```bash
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-anon-key"
SUPABASE_SERVICE_KEY="sua-service-key"
```

## 🐛 Debugging Passo a Passo

### 1. Verificar Edge Functions
```bash
# Listar funções
supabase functions list

# Ver logs
supabase functions logs

# Deploy função específica
supabase functions deploy generate-clips
```

### 2. Testar Função Específica
```bash
# Menu interativo
./scripts/test-functions.sh

# Ou testar diretamente
curl -X POST "https://seu-projeto.supabase.co/functions/v1/generate-clips" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua-service-key" \
  -d '{"video_id": "test-id"}'
```

### 3. Monitorar Banco de Dados
```bash
# Conectar ao banco
supabase db reset

# Ver tabelas
supabase db diff

# Executar query
supabase db shell
```

## 🔍 Problemas Comuns

### Função não encontrada
- Verifique se a função foi deployada
- Confirme o nome da função
- Verifique logs do Supabase

### Erro de autenticação
- Confirme as keys no `.env.debug`
- Verifique RLS policies
- Teste com service key

### Clips não são gerados
- Verifique se o vídeo foi transcrito
- Confirme se a IA está respondendo
- Verifique logs da função generate-clips

## 📊 Monitoramento

### Ver logs em tempo real
```bash
supabase functions logs --follow
```

### Verificar banco
```bash
# Ver vídeos
supabase db shell -c "SELECT * FROM videos LIMIT 5;"

# Ver clips
supabase db shell -c "SELECT * FROM clips LIMIT 5;"

# Ver análises
supabase db shell -c "SELECT * FROM content_analysis LIMIT 5;"
```

## 🆘 Ajuda

Se encontrar problemas:

1. Execute `./scripts/fix-functions.sh` primeiro
2. Verifique os logs: `supabase functions logs`
3. Teste uma função por vez
4. Verifique as credenciais no `.env.debug`
5. Confirme se o Supabase local está rodando

---

**🎬 Happy debugging! 🐛✨**
EOF
    
    log "✅ Guia salvo em: $guide_file"
}

# 8. Função principal
main() {
    log "🚀 Configurando ambiente de debug do ClipsForge..."
    
    # Executar todas as configurações
    verify_project_structure
    check_dependencies
    setup_supabase_config
    update_scripts
    create_test_video
    make_scripts_executable
    generate_usage_guide
    
    echo -e "\n${GREEN}🎉 Setup de debug concluído com sucesso!${NC}"
    echo -e "\n${PURPLE}📋 PRÓXIMOS PASSOS:${NC}"
    echo -e "${BLUE}1.${NC} Edite ${YELLOW}.env.debug${NC} com suas credenciais reais"
    echo -e "${BLUE}2.${NC} Execute ${YELLOW}./scripts/fix-functions.sh${NC} para corrigir problemas"
    echo -e "${BLUE}3.${NC} Teste com ${YELLOW}./scripts/test-functions.sh${NC}"
    echo -e "${BLUE}4.${NC} Execute fluxo completo com ${YELLOW}./scripts/debug-flow.sh${NC}"
    echo -e "\n${GREEN}📚 Consulte DEBUG_GUIDE.md para instruções detalhadas${NC}"
}

# Executar se chamado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi