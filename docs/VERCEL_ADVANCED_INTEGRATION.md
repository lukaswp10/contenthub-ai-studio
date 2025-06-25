# 🚀 ClipsForge + Vercel - Integração Avançada

## 📋 Melhorias Possíveis com Vercel API

Baseado na [documentação oficial da API REST do Vercel](https://vercel.com/docs/rest-api/reference), aqui estão **melhorias avançadas** que podemos implementar:

## 🔧 1. Automação de Deploy com Webhooks

### Webhook para Notificações de Deploy

```javascript
// scripts/vercel-webhook-handler.js
export default async function handler(req, res) {
  const { type, payload } = req.body;

  if (type === "deployment.succeeded") {
    // Notificar usuários sobre nova versão
    await notifyUsers({
      version: payload.deployment.meta.version,
      url: payload.deployment.url,
      changes: payload.deployment.meta.githubCommitMessage,
    });
  }

  res.status(200).json({ received: true });
}
```

### Configuração no Vercel Dashboard:

```bash
# 1. Ir para Project Settings → Git → Deploy Hooks
# 2. Adicionar webhook: https://clipsforge.vercel.app/api/deploy-webhook
# 3. Eventos: deployment.succeeded, deployment.failed
```

## 📊 2. Monitoramento Avançado com API

### Script de Monitoramento Automático

```javascript
// scripts/vercel-monitor.js
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
});

async function getDeploymentMetrics() {
  try {
    // Buscar últimos deployments
    const deployments = await vercel.deployments.list({
      limit: 10,
      projectId: process.env.VERCEL_PROJECT_ID,
    });

    // Métricas de performance
    const metrics = await Promise.all(
      deployments.map(async (deployment) => {
        const analytics = await vercel.analytics.get({
          deploymentId: deployment.uid,
          period: "24h",
        });

        return {
          version: deployment.meta?.githubCommitSha?.slice(0, 7),
          status: deployment.readyState,
          duration: deployment.buildingAt
            ? new Date(deployment.ready) - new Date(deployment.buildingAt)
            : null,
          performance: analytics.webVitals,
        };
      })
    );

    return metrics;
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);
    return [];
  }
}

// Executar a cada hora
setInterval(getDeploymentMetrics, 60 * 60 * 1000);
```

## 🌍 3. Deploy Multi-Ambiente Automatizado

### Script de Deploy Inteligente

```bash
# scripts/smart-deploy.sh
#!/bin/bash

BRANCH=$(git branch --show-current)
COMMIT_MSG=$(git log -1 --pretty=%B)

# Configurar ambiente baseado na branch
case $BRANCH in
  "main")
    ENVIRONMENT="production"
    VERCEL_PROJECT="clipsforge-prod"
    ;;
  "develop")
    ENVIRONMENT="staging"
    VERCEL_PROJECT="clipsforge-staging"
    ;;
  "feature/"*)
    ENVIRONMENT="preview"
    VERCEL_PROJECT="clipsforge-preview"
    ;;
esac

echo "🚀 Deploying $BRANCH to $ENVIRONMENT..."

# Deploy com configurações específicas
vercel deploy \
  --prod=$([[ $ENVIRONMENT == "production" ]] && echo "true" || echo "false") \
  --env VITE_ENVIRONMENT=$ENVIRONMENT \
  --env VITE_API_URL=$([[ $ENVIRONMENT == "production" ]] && echo "https://api.clipsforge.com" || echo "https://api-staging.clipsforge.com") \
  --meta branch=$BRANCH \
  --meta commit="$(git rev-parse HEAD)" \
  --meta message="$COMMIT_MSG"
```

## 🔐 4. Gestão Avançada de Environment Variables

### Script para Sincronizar Env Vars

```javascript
// scripts/sync-env-vars.js
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
});

const ENV_CONFIG = {
  production: {
    VITE_SUPABASE_URL: process.env.PROD_SUPABASE_URL,
    VITE_CLOUDINARY_CLOUD_NAME: process.env.PROD_CLOUDINARY_NAME,
    VITE_ANALYTICS_ID: process.env.PROD_ANALYTICS_ID,
  },
  preview: {
    VITE_SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
    VITE_CLOUDINARY_CLOUD_NAME: process.env.STAGING_CLOUDINARY_NAME,
    VITE_ANALYTICS_ID: process.env.STAGING_ANALYTICS_ID,
  },
};

async function syncEnvironmentVariables(target = "production") {
  const envVars = ENV_CONFIG[target];

  for (const [key, value] of Object.entries(envVars)) {
    try {
      await vercel.environmentVariables.create({
        projectId: process.env.VERCEL_PROJECT_ID,
        key,
        value,
        target: [target],
        type: "encrypted",
      });

      console.log(`✅ ${key} configurada para ${target}`);
    } catch (error) {
      if (error.code === "env_already_exists") {
        // Atualizar variável existente
        await vercel.environmentVariables.edit({
          projectId: process.env.VERCEL_PROJECT_ID,
          key,
          value,
          target: [target],
        });
        console.log(`🔄 ${key} atualizada para ${target}`);
      }
    }
  }
}

// Executar
syncEnvironmentVariables("production");
syncEnvironmentVariables("preview");
```

## 📈 5. Analytics e Relatórios Automáticos

### Dashboard de Performance

```javascript
// pages/api/vercel-analytics.js
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
});

export default async function handler(req, res) {
  try {
    // Web Vitals dos últimos 7 dias
    const webVitals = await vercel.analytics.webVitals({
      projectId: process.env.VERCEL_PROJECT_ID,
      period: "7d",
    });

    // Estatísticas de deployment
    const deployments = await vercel.deployments.list({
      projectId: process.env.VERCEL_PROJECT_ID,
      limit: 50,
    });

    const stats = {
      performance: {
        lcp: webVitals.lcp.p95,
        fid: webVitals.fid.p95,
        cls: webVitals.cls.p95,
        score: calculatePerformanceScore(webVitals),
      },
      deployments: {
        total: deployments.length,
        successful: deployments.filter((d) => d.readyState === "READY").length,
        failed: deployments.filter((d) => d.readyState === "ERROR").length,
        avgBuildTime: calculateAvgBuildTime(deployments),
      },
      traffic: {
        pageViews: webVitals.pageViews,
        uniqueVisitors: webVitals.uniqueVisitors,
        bounceRate: webVitals.bounceRate,
      },
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function calculatePerformanceScore(vitals) {
  // Algoritmo para calcular score baseado nos Core Web Vitals
  const lcpScore =
    vitals.lcp.p95 <= 2500
      ? 100
      : Math.max(0, 100 - (vitals.lcp.p95 - 2500) / 25);
  const fidScore =
    vitals.fid.p95 <= 100 ? 100 : Math.max(0, 100 - (vitals.fid.p95 - 100) / 3);
  const clsScore =
    vitals.cls.p95 <= 0.1
      ? 100
      : Math.max(0, 100 - (vitals.cls.p95 - 0.1) * 1000);

  return Math.round((lcpScore + fidScore + clsScore) / 3);
}
```

## 🚀 6. Deploy Rollback Automático

### Sistema de Rollback Inteligente

```javascript
// scripts/auto-rollback.js
import { Vercel } from "@vercel/sdk";

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
});

async function monitorAndRollback() {
  const currentDeployment = await vercel.deployments.get({
    deploymentId: process.env.CURRENT_DEPLOYMENT_ID,
  });

  // Verificar métricas críticas
  const analytics = await vercel.analytics.webVitals({
    deploymentId: currentDeployment.uid,
    period: "1h",
  });

  const shouldRollback =
    analytics.lcp.p95 > 4000 || // LCP muito alto
    analytics.errorRate > 0.05 || // Taxa de erro > 5%
    analytics.availability < 0.99; // Disponibilidade < 99%

  if (shouldRollback) {
    console.log("🚨 Métricas críticas detectadas. Iniciando rollback...");

    // Buscar último deployment estável
    const stableDeployment = await findLastStableDeployment();

    // Promover deployment estável
    await vercel.deployments.promote({
      deploymentId: stableDeployment.uid,
    });

    // Notificar equipe
    await notifyTeam({
      type: "rollback",
      reason: "Métricas críticas",
      rollbackTo: stableDeployment.meta.githubCommitSha,
    });
  }
}

// Executar verificação a cada 5 minutos
setInterval(monitorAndRollback, 5 * 60 * 1000);
```

## 🔧 7. Configuração Avançada (vercel.json)

### Configuração Otimizada

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1",
      "headers": {
        "cache-control": "s-maxage=0"
      }
    },
    {
      "src": "/static/(.*)",
      "dest": "/static/$1",
      "headers": {
        "cache-control": "s-maxage=31536000, immutable"
      }
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/app",
      "destination": "/dashboard",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "https://api.clipsforge.com/v1/$1"
    }
  ],
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1", "sfo1", "fra1"],
  "github": {
    "autoAlias": true,
    "autoJobCancelation": true
  }
}
```

## 📱 8. CLI Personalizado para Vercel

### Script CLI Customizado

```bash
# scripts/clipsforge-deploy
#!/bin/bash

function show_help() {
    echo "ClipsForge Deploy Tool"
    echo ""
    echo "Uso: ./clipsforge-deploy [COMANDO] [OPÇÕES]"
    echo ""
    echo "Comandos:"
    echo "  deploy [env]     Deploy para ambiente (prod|staging|preview)"
    echo "  status           Mostrar status dos deployments"
    echo "  rollback [id]    Fazer rollback para deployment específico"
    echo "  logs [env]       Mostrar logs do ambiente"
    echo "  analytics        Mostrar métricas de performance"
    echo ""
}

case $1 in
    "deploy")
        case $2 in
            "prod")
                echo "🚀 Deploying to PRODUCTION..."
                vercel --prod --confirm
                ;;
            "staging")
                echo "🧪 Deploying to STAGING..."
                vercel --target staging
                ;;
            *)
                echo "📝 Creating PREVIEW deployment..."
                vercel
                ;;
        esac
        ;;
    "status")
        echo "📊 Deployment Status:"
        vercel ls
        ;;
    "rollback")
        if [ -z "$2" ]; then
            echo "❌ Deployment ID required"
            exit 1
        fi
        echo "⏪ Rolling back to deployment $2..."
        vercel promote $2
        ;;
    "logs")
        echo "📋 Fetching logs..."
        vercel logs
        ;;
    "analytics")
        echo "📈 Performance Analytics:"
        node scripts/show-analytics.js
        ;;
    *)
        show_help
        ;;
esac
```

## 🎯 Implementação Recomendada

### Prioridade Alta (Implementar Primeiro):

1. **Monitoramento Avançado** - Script de métricas automáticas
2. **Environment Variables Sync** - Gestão centralizada
3. **Configuração vercel.json** - Otimizações de performance

### Prioridade Média:

4. **Webhooks de Deploy** - Notificações automáticas
5. **CLI Personalizado** - Facilitar operações
6. **Analytics Dashboard** - Visualização de métricas

### Prioridade Baixa (Futuro):

7. **Auto Rollback** - Sistema de recuperação automática
8. **Deploy Multi-Ambiente** - Pipelines complexos

## 🔗 Links Úteis

- [Vercel API Reference](https://vercel.com/docs/rest-api/reference)
- [Vercel SDK](https://vercel.com/docs/rest-api/sdk)
- [Deployment Hooks](https://vercel.com/docs/deployments/deploy-hooks)
- [Analytics API](https://vercel.com/docs/analytics/api)

---

**💡 Com essas melhorias, o ClipsForge terá uma integração Vercel de nível enterprise!**
