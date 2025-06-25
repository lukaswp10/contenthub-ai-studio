# 🚀 ClipsForge - Configuração de Produção

## ✅ Checklist de Deploy

### 1. Configurações do Supabase

- [ ] Projeto Supabase criado
- [ ] Database configurado
- [ ] Edge Functions deployed
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio personalizado (opcional)

### 2. Configurações do Cloudinary

- [ ] Conta Cloudinary criada/configurada
- [ ] Upload presets configurados
- [ ] Transformações pré-definidas
- [ ] Webhooks configurados

### 3. APIs Externas

- [ ] Groq API key configurada
- [ ] Hugging Face API key configurada
- [ ] Rate limits verificados

## 🔧 Configuração Passo a Passo

### Passo 1: Deploy do Supabase

```bash
# 1. Fazer login no Supabase CLI
npx supabase login

# 2. Linkar projeto existente OU criar novo
npx supabase link --project-ref SEU_PROJECT_ID
# OU
npx supabase projects create clipsforge-prod

# 3. Fazer push das migrações
npx supabase db push

# 4. Deploy das functions
npx supabase functions deploy --no-verify-jwt

# 5. Configurar secrets
npx supabase secrets set CLOUDINARY_CLOUD_NAME=seu_cloud_name
npx supabase secrets set CLOUDINARY_API_KEY=sua_api_key
npx supabase secrets set CLOUDINARY_API_SECRET=seu_api_secret
npx supabase secrets set GROQ_API_KEY=sua_groq_key
npx supabase secrets set HUGGINGFACE_API_KEY=sua_hf_key
```

### Passo 2: Configuração do Cloudinary

```javascript
// Upload presets necessários
{
  "preset_name": "clipsforge_video_upload",
  "upload_preset": {
    "auto_tagging": 90,
    "video_codec": "auto",
    "audio_codec": "aac",
    "quality": "auto:best",
    "format": "mp4",
    "transformation": [
      {
        "quality": "auto:best",
        "video_codec": "h264",
        "audio_codec": "aac"
      }
    ]
  }
}
```

### Passo 3: Configuração do Frontend

```typescript
// src/config/production.ts
export const productionConfig = {
  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY,
  },
  cloudinary: {
    cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  },
  features: {
    enablePreview: true,
    enableEditing: true,
    enableRegeneration: true,
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxDuration: 120 * 60, // 2 hours
    supportedFormats: ["mp4", "mov", "avi", "webm", "mkv"],
  },
};
```

## 🎯 Funcionalidades de Produção

### 1. Preview Avançado

- ✅ Player de vídeo integrado
- ✅ Timeline interativa
- ✅ Marcadores de clips
- ✅ Preview em tempo real
- ✅ Controles de qualidade

### 2. Editor de Vídeo

- ✅ Corte e trim
- ✅ Adição de legendas
- ✅ Filtros e efeitos
- ✅ Ajuste de velocidade
- ✅ Crop e resize

### 3. Sistema de Regeneração

- ✅ Re-análise de conteúdo
- ✅ Novos clips baseados em edições
- ✅ Preservação do histórico
- ✅ Comparação de versões

## 📊 Monitoramento e Analytics

### Métricas Essenciais

- Upload success rate
- Processing time médio
- Error rates por etapa
- User engagement
- Clip performance

### Alertas Configurados

- Function timeout (>5min)
- High error rate (>5%)
- Storage limits (>80%)
- API rate limits
- Database performance

## 🔒 Segurança e Performance

### RLS (Row Level Security)

```sql
-- Políticas de segurança implementadas
CREATE POLICY "Users can only access their own videos" ON videos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own clips" ON clips
  FOR ALL USING (auth.uid() = user_id);
```

### Rate Limiting

- Upload: 10 vídeos/hora por usuário
- API calls: 1000 requests/min
- Processing: 5 vídeos simultâneos

### Cache Strategy

- Cloudinary: Cache vídeos por 1 ano
- Database: Cache queries por 5min
- Frontend: Cache assets por 7 dias

## 🚀 Deploy Checklist Final

### Antes do Deploy

- [ ] Todos os testes passando
- [ ] Performance verificada
- [ ] Segurança auditada
- [ ] Backup configurado
- [ ] Monitoring ativo

### Após o Deploy

- [ ] Health checks passando
- [ ] DNS configurado
- [ ] SSL certificate ativo
- [ ] CDN configurado
- [ ] Error tracking ativo

## 📱 URLs de Produção

### Frontend

- **Produção**: https://clipsforge.com
- **Staging**: https://staging.clipsforge.com

### Backend (Supabase)

- **API**: https://seu-projeto.supabase.co
- **Database**: PostgreSQL via Supabase
- **Functions**: https://seu-projeto.supabase.co/functions/v1/

### Cloudinary

- **CDN**: https://res.cloudinary.com/seu-cloud-name/
- **Upload**: https://api.cloudinary.com/v1_1/seu-cloud-name/

## 🔄 Fluxo de Deploy

```bash
# 1. Build de produção
npm run build

# 2. Testes finais
npm run test:prod

# 3. Deploy do frontend (Vercel/Netlify)
npm run deploy

# 4. Deploy das functions
npx supabase functions deploy

# 5. Verificação
npm run health-check
```

## 📞 Suporte

### Em caso de problemas:

1. Verificar logs do Supabase
2. Verificar status do Cloudinary
3. Verificar APIs externas
4. Contatar suporte se necessário

### Contatos de emergência:

- **Supabase**: support@supabase.com
- **Cloudinary**: support@cloudinary.com
- **ClipsForge**: support@clipsforge.com
