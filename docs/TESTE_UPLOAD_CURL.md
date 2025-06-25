# 🧪 Teste Completo do Fluxo de Upload via CURL

Este documento descreve como testar todo o fluxo de upload do ClipsForge usando comandos `curl`, desde o upload até a geração de clips.

## 📋 **Scripts Disponíveis**

### 1. **Script Manual** (`scripts/test-manual.sh`)
```bash
./scripts/test-manual.sh
```
- Mostra todos os comandos `curl` necessários
- Para execução passo a passo manual
- Ideal para debug e entendimento do fluxo

### 2. **Script Automatizado** (`scripts/test-upload-simple.sh`)
```bash
./scripts/test-upload-simple.sh
```
- Execução automatizada completa
- Monitoramento em tempo real
- Verificação de clips gerados

### 3. **Script Completo** (`scripts/test-upload-flow.sh`)
```bash
./scripts/test-upload-flow.sh
```
- Versão mais robusta com tratamento de erros
- Análise detalhada de cada etapa
- Logs completos de debug

## 🎯 **Fluxo Completo Testado**

### **Etapa 1: Login**
```bash
curl -s -X POST "https://rgwbtdzdeibobuveegfp.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "seu_email@gmail.com", "password": "sua_senha"}' | jq .
```

**Resposta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

### **Etapa 2: Solicitar Upload**
```bash
curl -s -X POST "https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/upload-video" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "apikey: SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "videoplayback (1).mp4",
    "fileSize": 2574521,
    "contentType": "video/mp4",
    "duration": 75
  }' | jq .
```

**Resposta esperada:**
```json
{
  "success": true,
  "video_id": "uuid-do-video",
  "upload_url": "https://api.cloudinary.com/v1_1/dyqjxsnjp/video/upload",
  "upload_params": {
    "public_id": "videos/user_id/video_id_timestamp_random_filename",
    "folder": "videos/user_id",
    "signature": "hash_assinatura",
    "api_key": "586415153212745",
    ...
  }
}
```

### **Etapa 3: Upload para Cloudinary**
```bash
curl -s -X POST "UPLOAD_URL" \
  -F "public_id=PUBLIC_ID" \
  -F "folder=FOLDER" \
  -F "resource_type=video" \
  -F "type=upload" \
  -F "timestamp=TIMESTAMP" \
  -F "video_codec=auto" \
  -F "audio_codec=auto" \
  -F "context=CONTEXT" \
  -F "upload_preset=UPLOAD_PRESET" \
  -F "signature=SIGNATURE" \
  -F "api_key=API_KEY" \
  -F "file=@/caminho/para/video.mp4" | jq .
```

**Resposta esperada:**
```json
{
  "public_id": "videos/user_id/video_id_timestamp_random_filename",
  "secure_url": "https://res.cloudinary.com/dyqjxsnjp/video/upload/...",
  "resource_type": "video",
  "created_at": "2024-01-15T10:30:00Z",
  "bytes": 2574521,
  "duration": 75.5
}
```

### **Etapa 4: Atualizar Registro**
```bash
curl -s -X PATCH "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos?id=eq.VIDEO_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "apikey: SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "cloudinary_public_id": "PUBLIC_ID",
    "cloudinary_secure_url": "SECURE_URL",
    "processing_status": "queued"
  }'
```

### **Etapa 5: Iniciar Transcrição**
```bash
curl -s -X POST "https://rgwbtdzdeibobuveegfp.supabase.co/functions/v1/transcribe-video" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "apikey: SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "VIDEO_ID",
    "cloudinary_url": "SECURE_URL",
    "cloudinary_public_id": "PUBLIC_ID"
  }' | jq .
```

### **Etapa 6: Monitorar Progresso**
```bash
curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos?id=eq.VIDEO_ID&select=processing_status,error_message" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "apikey: SUPABASE_ANON_KEY" | jq .
```

**Status possíveis:**
- `uploading` → `queued` → `transcribing` → `analyzing` → `generating_clips` → `ready`
- `failed` (em caso de erro)

### **Etapa 7: Verificar Clips Gerados**
```bash
curl -s -X GET "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/clips?video_id=eq.VIDEO_ID&select=*" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "apikey: SUPABASE_ANON_KEY" | jq .
```

**Resposta esperada:**
```json
[
  {
    "id": "clip-uuid-1",
    "title": "Clip 1 - Momento Viral",
    "start_time": 10.5,
    "end_time": 40.2,
    "duration_seconds": 29.7,
    "viral_score": 8.5,
    "cloudinary_url": "https://res.cloudinary.com/dyqjxsnjp/video/upload/...",
    "created_at": "2024-01-15T10:35:00Z"
  },
  ...
]
```

## 🔧 **Configurações Necessárias**

### **Arquivo de Teste**
```bash
VIDEO_FILE="/home/lucasmartins/Downloads/videoplayback (1).mp4"
```

### **Credenciais**
```bash
SUPABASE_URL="https://rgwbtdzdeibobuveegfp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
USER_EMAIL="seu_email@gmail.com"
USER_PASSWORD="sua_senha"
```

## 🚨 **Problemas Comuns e Soluções**

### **1. Erro 400 - Invalid Credentials**
```json
{
  "code": 400,
  "error_code": "invalid_credentials",
  "msg": "Invalid login credentials"
}
```
**Solução:** Verificar email e senha corretos.

### **2. Erro 409 - Duplicate Key**
```json
{
  "code": "23505",
  "message": "duplicate key value violates unique constraint \"videos_cloudinary_public_id_key\""
}
```
**Solução:** O `public_id` já existe. Aguarde alguns segundos e tente novamente.

### **3. Erro 401 - Unauthorized**
```json
{
  "message": "JWT expired"
}
```
**Solução:** Refazer login para obter novo `access_token`.

### **4. Erro no Cloudinary**
```json
{
  "error": {
    "message": "Invalid signature"
  }
}
```
**Solução:** Verificar se todos os parâmetros estão corretos e na ordem certa.

## 📊 **Métricas de Sucesso**

### **Tempos Esperados:**
- **Login:** < 1 segundo
- **Solicitação de upload:** < 2 segundos  
- **Upload Cloudinary:** 10-30 segundos (depende do tamanho)
- **Transcrição:** 30-60 segundos
- **Análise:** 15-30 segundos
- **Geração de clips:** 30-45 segundos
- **Total:** 2-3 minutos

### **Resultados Esperados:**
- ✅ **3 clips gerados** automaticamente
- ✅ **Scores virais** calculados (0-10)
- ✅ **URLs válidas** no Cloudinary
- ✅ **Status final:** `ready`

## 🎯 **Como Usar os Scripts**

### **1. Teste Manual (Recomendado para Debug)**
```bash
./scripts/test-manual.sh
# Copie e execute cada comando manualmente
# Substitua os valores conforme necessário
```

### **2. Teste Automatizado**
```bash
# Edite o script com suas credenciais
nano scripts/test-upload-simple.sh

# Execute
./scripts/test-upload-simple.sh
```

### **3. Monitoramento Contínuo**
```bash
# Para monitorar um vídeo específico
VIDEO_ID="seu-video-id"
watch -n 5 'curl -s -H "Authorization: Bearer $ACCESS_TOKEN" -H "apikey: $SUPABASE_ANON_KEY" "https://rgwbtdzdeibobuveegfp.supabase.co/rest/v1/videos?id=eq.$VIDEO_ID&select=processing_status" | jq .'
```

## ✅ **Checklist de Teste**

- [ ] Login funcionando
- [ ] Upload autorizado  
- [ ] Cloudinary recebendo arquivo
- [ ] Registro atualizado no banco
- [ ] Transcrição iniciada
- [ ] Status mudando corretamente
- [ ] Clips sendo gerados
- [ ] URLs acessíveis
- [ ] Scores calculados
- [ ] Status final = `ready`

**🎉 Com estes scripts, você pode testar todo o fluxo de upload e identificar problemas antes que os usuários encontrem!** 