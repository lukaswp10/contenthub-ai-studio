# 🚀 ClipsForge + Vercel - Deploy Automático

## ✅ Configuração Atual

O ClipsForge já está integrado com o Vercel para **deploy automático**! 🎉

### Como funciona:

```
📝 COMMIT → 📤 PUSH → 🚀 DEPLOY AUTOMÁTICO → ✅ PRODUÇÃO
```

## ⚙️ Configuração no Vercel Dashboard

### 1. Variáveis de Ambiente Obrigatórias

Configure estas variáveis no **Vercel Dashboard** → **Settings** → **Environment Variables**:

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=seu-cloud-name

# Opcional - Analytics
VITE_ANALYTICS_ID=seu-analytics-id
```

### 2. Build Settings

O Vercel detecta automaticamente as configurações do Vite:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## 🔄 Workflow de Deploy

### Para Frontend (Automático)

```bash
# 1. Fazer mudanças no código
# 2. Commit e push
git add .
git commit -m "feat: nova funcionalidade incrível"
git push origin main

# 🚀 Vercel faz deploy automático em ~2 minutos
```

### Para Backend (Manual quando necessário)

```bash
# Apenas quando mudar Edge Functions ou Database
./scripts/deploy-production.sh
```

## 📊 Monitoramento no Vercel

### Dashboard do Vercel mostra:

- ✅ **Build Status** - Status do build atual
- 📈 **Performance** - Core Web Vitals
- 🌍 **Deployments** - Histórico de deploys
- 📱 **Preview URLs** - URLs de preview para branches
- 🔍 **Function Logs** - Logs das serverless functions

### URLs de Acesso:

- **Produção**: https://clipsforge.vercel.app
- **Preview**: https://clipsforge-git-branch.vercel.app
- **Dashboard**: https://vercel.com/dashboard

## 🎯 Branches e Ambientes

### Ambientes Automáticos:

- **`main`** → **Produção** (https://clipsforge.vercel.app)
- **`develop`** → **Staging** (https://clipsforge-git-develop.vercel.app)
- **`feature/*`** → **Preview** (https://clipsforge-git-feature-xyz.vercel.app)

### Configuração Recomendada:

```bash
# Desenvolvimento
git checkout -b feature/nova-funcionalidade
# ... fazer mudanças
git push origin feature/nova-funcionalidade
# 🔍 Vercel cria preview automático

# Produção
git checkout main
git merge feature/nova-funcionalidade
git push origin main
# 🚀 Deploy automático para produção
```

## 🔧 Configurações Avançadas

### 1. Redirects (vercel.json)

```json
{
  "redirects": [
    {
      "source": "/app",
      "destination": "/dashboard",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### 2. Build Optimization

```json
{
  "build": {
    "env": {
      "VITE_BUILD_MODE": "production",
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "app/**": {
      "maxDuration": 30
    }
  }
}
```

## 📈 Performance e Analytics

### Core Web Vitals Esperados:

- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

### Otimizações Ativas:

- ✅ **Image Optimization** - Otimização automática de imagens
- ✅ **Edge Caching** - Cache global na edge network
- ✅ **Compression** - Gzip/Brotli automático
- ✅ **Tree Shaking** - Remoção de código não usado
- ✅ **Code Splitting** - Carregamento sob demanda

## 🚨 Troubleshooting

### Problemas Comuns:

#### 1. Build Failing

```bash
# Verificar logs no Vercel Dashboard
# Ou localmente:
npm run build
```

#### 2. Environment Variables

```bash
# Verificar se todas estão configuradas:
vercel env ls
```

#### 3. Deploy Timeout

```bash
# Verificar tamanho do bundle:
npm run build
du -sh dist/
```

### Comandos Úteis:

```bash
# Vercel CLI
npm i -g vercel
vercel login
vercel --prod  # Deploy manual
vercel logs    # Ver logs
vercel env ls  # Listar env vars
```

## 🎉 Vantagens da Integração

### ✅ **Zero Config**

- Deploy automático no push
- Detecção automática do framework
- Otimizações automáticas

### ✅ **Performance**

- CDN global (99.99% uptime)
- Edge functions próximas aos usuários
- Cache inteligente

### ✅ **Developer Experience**

- Preview URLs para cada branch
- Rollback com 1 clique
- Logs em tempo real

### ✅ **Escalabilidade**

- Auto-scaling automático
- Sem limites de tráfego
- Monitoramento integrado

## 🔗 Links Úteis

- **Dashboard**: https://vercel.com/dashboard
- **Docs**: https://vercel.com/docs
- **Status**: https://vercel-status.com
- **Discord**: https://vercel.com/discord

---

**🚀 Com Vercel + ClipsForge, cada push é um deploy perfeito!**
