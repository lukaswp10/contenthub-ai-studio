# 🧹 ClipsForge - Plano de Limpeza e Reestruturação

## 📊 **Análise Atual vs Necessário**

### ✅ **Manter (Essencial)**

```
📁 PÁGINAS NECESSÁRIAS:
✅ Landing Page (Index.tsx) - Melhorar
✅ Auth (Login/Register) - Manter
✅ Dashboard - Reestruturar
✅ Upload - Integrar ao Dashboard
✅ Editor - Criar novo (VideoStudio base)
✅ Galeria - Reestruturar (Clips.tsx base)
✅ Analytics - Criar novo

📁 COMPONENTES ESSENCIAIS:
✅ AuthContext - Manter
✅ UI Components - Manter
✅ Upload components - Manter
✅ Video components - Reestruturar

📁 EDGE FUNCTIONS NECESSÁRIAS:
✅ upload-video - Manter
✅ transcribe-video - Manter
✅ analyze-content - Manter
✅ generate-clips - Manter
✅ connect-social-account - Manter (Ayrshare)
✅ schedule-post - Manter (Ayrshare)

📁 BANCO DE DADOS:
✅ profiles - Manter
✅ videos - Manter
✅ clips - Manter
✅ content_analysis - Manter
✅ social_accounts - Manter (Ayrshare)
✅ scheduled_posts - Manter
```

### ❌ **Remover (Desnecessário)**

```
📁 ARQUIVOS DE TESTE:
❌ test-*.sh (todos os scripts de teste)
❌ test-*.sql (dados de teste)
❌ debug-*.md (relatórios de debug)
❌ *.sql (dados mockados)

📁 PÁGINAS DESNECESSÁRIAS:
❌ Schedule.tsx (integrar ao Dashboard)
❌ Onboarding.tsx (simplificar)
❌ VideoStudio.tsx (reestruturar como Editor)

📁 EDGE FUNCTIONS DESNECESSÁRIAS:
❌ regenerate-clips (duplicata)
❌ generate-reels (duplicata)
❌ customer-portal (não é necessário agora)
❌ create-checkout (não é necessário agora)
❌ check-subscription (não é necessário agora)
❌ refresh-social-account (simplificar)
❌ complete-oauth (integrar ao connect-social)

📁 DOCUMENTAÇÃO EXCESSIVA:
❌ docs/ (manter apenas essencial)
❌ scripts/ (manter apenas deploy)
❌ tools/ (remover)
❌ tests/ (simplificar)
```

## 🏗️ **Nova Estrutura Proposta**

### **1. Landing Page Moderna**

```
📍 src/pages/Landing.tsx (novo)
🎯 Funcionalidades:
• Hero section explicativo
• Vídeo demonstrativo
• Seções de funcionalidades
• Call-to-action para registro
• Design moderno e conversivo
```

### **2. Sistema de Autenticação**

```
📍 src/pages/auth/ (manter e melhorar)
🎯 Funcionalidades:
• Login/Register melhorados
• Confirmação por email
• Google OAuth integrado
• Segurança reforçada
```

### **3. Dashboard Central**

```
📍 src/pages/Dashboard.tsx (reestruturar)
🎯 Seções:
• Upload rápido
• Estatísticas gerais
• Vídeos recentes
• Clips em destaque
• Status de processamento
```

### **4. Editor de Vídeo**

```
📍 src/pages/Editor.tsx (novo)
🎯 Funcionalidades:
• Interface bonita de edição
• Adicionar legendas
• Selecionar partes manualmente
• Preview em tempo real
• Gerar novos clips
```

### **5. Galeria**

```
📍 src/pages/Gallery.tsx (reestruturar Clips.tsx)
🎯 Funcionalidades:
• Grid de vídeos e clips
• Filtros e busca
• Organização por data/tipo
• Preview rápido
• Ações em lote
```

### **6. Redes Sociais**

```
📍 src/pages/Social.tsx (novo)
🎯 Funcionalidades:
• Conectar contas (Ayrshare)
• Agendar posts
• Publicar da galeria
• Status de publicações
```

### **7. Analytics**

```
📍 src/pages/Analytics.tsx (novo)
🎯 Funcionalidades:
• Dashboard completo
• Métricas: views, likes, seguidores
• Gráficos interativos
• Dados de todas as contas
• Relatórios exportáveis
```

## 🗄️ **Reestruturação do Banco**

### **Tabelas Essenciais (Manter)**

```sql
-- Usuários e perfis
profiles (id, email, full_name, plan_type, created_at)

-- Vídeos principais
videos (id, user_id, title, description, file_url, status, created_at)

-- Clips gerados
clips (id, video_id, title, start_time, end_time, file_url, viral_score, created_at)

-- Análise de conteúdo
content_analysis (id, video_id, transcript, topics, sentiment, viral_factors)

-- Contas sociais (Ayrshare)
social_accounts (id, user_id, platform, account_id, username, connected_at)

-- Posts agendados
scheduled_posts (id, user_id, clip_id, platforms, content, scheduled_for, status)
```

### **Tabelas para Remover**

```sql
❌ ayrshare_profiles (duplicata)
❌ clips_updates (desnecessária)
❌ profiles_updates (desnecessária)
❌ user_settings (simplificar)
```

## 🔧 **Edge Functions Limpas**

### **Manter e Otimizar**

```
✅ upload-video - Upload e validação
✅ transcribe-video - Whisper API
✅ analyze-content - Groq AI analysis
✅ generate-clips - Clip generation
✅ connect-social - Ayrshare integration
✅ schedule-post - Ayrshare posting
```

### **Remover**

```
❌ regenerate-clips
❌ generate-reels
❌ customer-portal
❌ create-checkout
❌ check-subscription
❌ refresh-social-account
❌ complete-oauth
```

## 📁 **Nova Estrutura de Pastas**

```
src/
├── components/
│   ├── ui/ (manter shadcn/ui)
│   ├── auth/ (componentes de auth)
│   ├── upload/ (componentes de upload)
│   ├── editor/ (novo - componentes de edição)
│   ├── gallery/ (novo - componentes de galeria)
│   ├── social/ (novo - componentes sociais)
│   └── analytics/ (novo - componentes de analytics)
├── pages/
│   ├── Landing.tsx (novo)
│   ├── Dashboard.tsx (reestruturar)
│   ├── Editor.tsx (novo)
│   ├── Gallery.tsx (novo)
│   ├── Social.tsx (novo)
│   ├── Analytics.tsx (novo)
│   └── auth/ (manter)
├── hooks/
│   ├── useVideoUpload.ts (manter)
│   ├── useVideoEditor.ts (novo)
│   ├── useSocialConnect.ts (novo)
│   └── useAnalytics.ts (novo)
├── contexts/
│   └── AuthContext.tsx (manter)
├── lib/
│   ├── utils.ts (manter)
│   ├── ayrshare.ts (novo)
│   └── analytics.ts (novo)
└── types/
    ├── video.ts (novo)
    ├── social.ts (manter)
    └── analytics.ts (novo)
```

## 🚀 **Ordem de Implementação**

### **Fase 1: Limpeza (Hoje)**

1. ❌ Remover arquivos desnecessários
2. ❌ Limpar Edge Functions não utilizadas
3. ❌ Simplificar banco de dados
4. ❌ Remover código morto

### **Fase 2: Reestruturação (Amanhã)**

1. ✅ Criar Landing Page moderna
2. ✅ Melhorar sistema de auth
3. ✅ Reestruturar Dashboard
4. ✅ Criar Editor de vídeo

### **Fase 3: Funcionalidades (Próximos dias)**

1. ✅ Galeria completa
2. ✅ Integração Ayrshare
3. ✅ Sistema de Analytics
4. ✅ Testes e otimizações

## 🎯 **Resultado Final**

### **Projeto Limpo e Profissional**

- 📁 Estrutura organizada
- 🗑️ Zero código morto
- 🔧 Apenas funcionalidades essenciais
- 📊 Performance otimizada
- 🔐 Segurança reforçada

### **Funcionalidades Completas**

- 🏠 Landing Page conversiva
- 🔐 Auth completo (email + Google)
- 📊 Dashboard central
- ✂️ Editor de vídeo avançado
- 🖼️ Galeria organizada
- 📱 Integração social (Ayrshare)
- 📈 Analytics completo

---

**🎯 Foco: Projeto enxuto, profissional e com todas as funcionalidades solicitadas!**
