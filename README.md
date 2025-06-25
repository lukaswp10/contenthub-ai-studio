# 🎬 ClipsForge

> **Transforme seus vídeos em clips virais automaticamente com IA**

ClipsForge é uma plataforma completa que utiliza inteligência artificial para analisar seus vídeos e gerar clips otimizados para redes sociais, com publicação automática e analytics detalhado.

![ClipsForge Banner](https://via.placeholder.com/1200x400/7C3AED/FFFFFF?text=ClipsForge+-+AI+Video+Clips)

## ✨ Funcionalidades

### 🏠 **Landing Page Moderna**
- Hero section conversivo com gradientes
- Demonstração das funcionalidades
- Call-to-action otimizado
- Design responsivo e profissional

### 🔐 **Sistema de Autenticação**
- Login e registro seguros
- Confirmação por email
- Google OAuth integrado
- Sessões persistentes

### 📊 **Dashboard Central**
- Upload rápido de vídeos
- Estatísticas em tempo real
- Monitoramento de processamento
- Visão geral dos clips

### ✂️ **Editor de Vídeo Avançado**
- Player integrado com controles
- Timeline visual interativa
- Edição de propriedades
- Geração de novos clips
- Preview em tempo real

### 🖼️ **Galeria Completa**
- Visualização em grid/lista
- Filtros avançados e busca
- Métricas de performance
- Ações em lote
- Organização por data/tipo

### 📱 **Redes Sociais (Ayrshare)**
- Conexão com múltiplas plataformas
- Agendamento inteligente
- Publicação automática
- Analytics por rede social
- Templates de conteúdo

### 📈 **Analytics Detalhado**
- Dashboard com métricas gerais
- Gráficos interativos
- Performance por plataforma
- Top clips com viral score
- Exportação de dados

## 🚀 Tecnologias

### **Frontend**
- **React 18** + TypeScript
- **Tailwind CSS** para styling
- **Radix UI** para componentes
- **React Router** para navegação
- **React Query** para data fetching
- **Recharts** para gráficos

### **Backend**
- **Supabase** (PostgreSQL + Auth + Storage)
- **Edge Functions** para processamento
- **Ayrshare API** para redes sociais

### **IA & Processamento**
- **Whisper API** para transcrição
- **Groq AI** para análise de conteúdo
- **FFmpeg** para processamento de vídeo

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                 # Componentes UI (shadcn/ui)
│   ├── auth/              # Componentes de autenticação
│   ├── upload/            # Componentes de upload
│   ├── editor/            # Componentes de edição
│   ├── gallery/           # Componentes de galeria
│   ├── social/            # Componentes sociais
│   └── analytics/         # Componentes de analytics
├── pages/
│   ├── Landing.tsx        # Landing page
│   ├── Dashboard.tsx      # Dashboard principal
│   ├── Editor.tsx         # Editor de vídeo
│   ├── Gallery.tsx        # Galeria de conteúdo
│   ├── Social.tsx         # Redes sociais
│   ├── Analytics.tsx      # Analytics
│   └── auth/              # Páginas de autenticação
├── hooks/                 # Hooks customizados
├── contexts/              # React contexts
├── lib/                   # Utilitários e integrações
├── types/                 # Definições de tipos
└── integrations/
    └── supabase/          # Cliente Supabase
```

## 🛠️ Instalação e Configuração

### **Pré-requisitos**
- Node.js 18+
- npm ou yarn
- Conta Supabase
- Conta Ayrshare (para redes sociais)

### **1. Clone o repositório**
```bash
git clone https://github.com/clipsforge/clipsforge.git
cd clipsforge
```

### **2. Instale as dependências**
```bash
npm install
```

### **3. Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase
VITE_AYRSHARE_API_KEY=sua_chave_ayrshare
```

### **4. Configure o Supabase**
```bash
# Instale a CLI do Supabase
npm install -g supabase

# Faça login
supabase login

# Inicie o projeto local
supabase start

# Execute as migrações
supabase db push
```

### **5. Inicie o desenvolvimento**
```bash
npm run dev
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Constrói para produção
npm run preview      # Preview da build
npm run lint         # Executa linting
npm test             # Executa testes
./scripts/deploy.sh  # Deploy para produção
```

## 🌐 Deploy

### **Vercel (Recomendado)**
```bash
# Instale a CLI do Vercel
npm i -g vercel

# Execute o deploy
./scripts/deploy.sh
```

### **Outras Plataformas**
O projeto é compatível com:
- Netlify
- AWS Amplify
- Railway
- Render

## 🔧 Edge Functions

O projeto utiliza 6 Edge Functions essenciais:

1. **upload-video** - Upload e validação
2. **transcribe-video** - Transcrição com Whisper
3. **analyze-content** - Análise com Groq AI
4. **generate-clips** - Geração de clips
5. **connect-social-account** - Integração Ayrshare
6. **schedule-post** - Publicação automática

## 🎯 Fluxo de Uso

1. **📤 Upload** - Usuário faz upload do vídeo
2. **🎧 Transcrição** - IA transcreve o áudio
3. **🧠 Análise** - IA analisa conteúdo e identifica momentos virais
4. **✂️ Geração** - Sistema gera 3 clips automaticamente
5. **✏️ Edição** - Usuário pode editar clips no editor
6. **📱 Publicação** - Clips são publicados nas redes sociais
7. **📊 Analytics** - Acompanhamento de performance

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- 📧 Email: suporte@clipsforge.com
- 💬 Discord: [ClipsForge Community](https://discord.gg/clipsforge)
- 📚 Documentação: [docs.clipsforge.com](https://docs.clipsforge.com)

## 🎉 Status do Projeto

- ✅ **Estrutura base** - Completa
- ✅ **Interface UI** - Completa
- ✅ **Autenticação** - Completa
- ✅ **Upload de vídeos** - Completa
- 🔄 **Processamento IA** - Em desenvolvimento
- 🔄 **Integração Ayrshare** - Em desenvolvimento
- 📋 **Testes** - Planejado

---

**🚀 Transforme seus vídeos em clips virais com ClipsForge!**
