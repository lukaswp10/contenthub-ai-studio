# 🎬 ClipsForge

> **Transforme seus vídeos em clips virais automaticamente com IA**

ClipsForge é uma plataforma revolucionária que utiliza inteligência artificial para analisar seus vídeos longos e gerar clips curtos otimizados para redes sociais, maximizando o engajamento e alcance.

## ✨ Principais Funcionalidades

- 🤖 **IA Avançada**: Análise inteligente de conteúdo para identificar os melhores momentos
- ⚡ **Geração Automática**: Criação de clips otimizados para cada plataforma social
- 🎯 **Multi-Plataforma**: Suporte para TikTok, Instagram Reels, YouTube Shorts e mais
- 📊 **Analytics Inteligente**: Insights sobre performance e engajamento
- 🔄 **Automação Completa**: Agendamento e publicação automática
- 🎨 **Customização Avançada**: Templates e estilos personalizáveis

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI/UX**: Tailwind CSS + Shadcn/ui + Lucide Icons
- **Backend**: Supabase (Database + Auth + Storage + Edge Functions)
- **IA**: Análise de conteúdo e geração automática de clips
- **Processamento**: Cloudinary para otimização de vídeos
- **Testes**: Vitest + Testing Library

## 📁 Estrutura do Projeto

```
clipsforge/
├── 📂 src/                     # Código fonte principal
│   ├── 📂 components/          # Componentes React reutilizáveis
│   ├── 📂 pages/              # Páginas da aplicação
│   ├── 📂 hooks/              # Custom hooks
│   ├── 📂 contexts/           # Context providers
│   └── 📂 lib/                # Utilitários e configurações
├── 📂 supabase/               # Backend e banco de dados
│   ├── 📂 functions/          # Edge Functions (IA e processamento)
│   └── 📂 migrations/         # Migrações do banco
├── 📂 docs/                   # Documentação completa
├── 📂 scripts/                # Scripts de automação
└── 📂 tests/                  # Testes automatizados
```

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Supabase CLI

### Configuração Inicial

1. **Clone o repositório**
```bash
git clone https://github.com/clipsforge/clipsforge.git
cd clipsforge
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env.local
# Configure suas variáveis de ambiente
```

4. **Inicie o Supabase local**
```bash
npx supabase start
```

5. **Execute o projeto**
```bash
npm run dev
```

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm test` - Executa os testes
- `npm run lint` - Verificação de código

## 🔧 Configuração

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## 📖 Documentação

- [📋 Estrutura do Projeto](docs/PROJECT_STRUCTURE.md)
- [🔄 Fluxo de Trabalho](docs/NOVO_FLUXO.md)
- [🐛 Troubleshooting](docs/TROUBLESHOOTING.md)
- [📊 Resumo da Organização](docs/ORGANIZATION_SUMMARY.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🌟 Suporte

- 📧 Email: support@clipsforge.com
- 💬 Discord: [ClipsForge Community](https://discord.gg/clipsforge)
- 🐛 Issues: [GitHub Issues](https://github.com/clipsforge/clipsforge/issues)

---

<div align="center">
  <strong>Feito com ❤️ pela equipe ClipsForge</strong>
  <br>
  <a href="https://clipsforge.com">🌐 Website</a> •
  <a href="https://twitter.com/clipsforge">🐦 Twitter</a> •
  <a href="https://linkedin.com/company/clipsforge">💼 LinkedIn</a>
</div>
