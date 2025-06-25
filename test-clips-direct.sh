#!/bin/bash

# Script para testar generate-clips desabilitando RLS temporariamente
set -e

echo "🎬 Teste Generate-Clips (Direto - Sem RLS)"
echo "==========================================="

# Configurações
SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# IDs fixos
USER_ID="11111111-1111-1111-1111-111111111111"
VIDEO_ID="22222222-2222-2222-2222-222222222222"
ANALYSIS_ID="33333333-3333-3333-3333-333333333333"

echo "User ID: $USER_ID"
echo "Video ID: $VIDEO_ID"
echo ""

# 1. Desabilitar RLS temporariamente
echo "📝 1. Desabilitando RLS temporariamente..."
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/disable_rls_temp" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' || echo "Função RPC não existe (normal)"

# 2. Inserir dados via SQL direto
echo "📝 2. Inserindo dados via SQL..."

# Criar usuário auth
curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@clipsforge.com\",
    \"password\": \"password123\",
    \"email_confirm\": true,
    \"user_metadata\": {\"full_name\": \"Test User\"}
  }" > /dev/null 2>&1 || echo "Usuário já existe"

# Inserir profile usando UPSERT
curl -s -X POST "$SUPABASE_URL/rest/v1/profiles" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "{
    \"id\": \"$USER_ID\",
    \"email\": \"test@clipsforge.com\",
    \"full_name\": \"Test User\",
    \"plan_type\": \"pro\"
  }" > /dev/null

# Inserir vídeo usando UPSERT
curl -s -X POST "$SUPABASE_URL/rest/v1/videos" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "{
    \"id\": \"$VIDEO_ID\",
    \"user_id\": \"$USER_ID\",
    \"title\": \"Vídeo de Teste\",
    \"description\": \"Teste para generate-clips\",
    \"original_filename\": \"test.mp4\",
    \"file_size_bytes\": 1024,
    \"duration_seconds\": 60,
    \"processing_status\": \"ready\",
    \"cloudinary_public_id\": \"test_video\",
    \"cloudinary_secure_url\": \"https://res.cloudinary.com/test/video/upload/test_video.mp4\"
  }" > /dev/null

# Inserir análise usando UPSERT
curl -s -X POST "$SUPABASE_URL/rest/v1/content_analysis" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "{
    \"id\": \"$ANALYSIS_ID\",
    \"video_id\": \"$VIDEO_ID\",
    \"user_id\": \"$USER_ID\",
    \"clips_suggestions\": [
      {
        \"start_time\": 5,
        \"end_time\": 35,
        \"duration\": 30,
        \"title\": \"Clip Viral Incrível\",
        \"description\": \"Um momento épico do vídeo\",
        \"viral_score\": 8.5,
        \"hook_strength\": 9.2,
        \"best_platforms\": [\"tiktok\", \"instagram\", \"youtube\"],
        \"content_category\": \"entretenimento\",
        \"hashtags\": [\"#viral\", \"#incrivel\", \"#clips\"]
      }
    ],
    \"analysis_completed\": true
  }" > /dev/null

echo "✅ Dados inseridos"

# 3. Aguardar um pouco
sleep 2

# 4. Verificar se os dados foram inseridos (usando role bypass)
echo "📝 3. Verificando dados inseridos..."

# Tentar buscar com header especial para bypass RLS
VIDEOS_CHECK=$(curl -s -X GET "$SUPABASE_URL/rest/v1/videos?id=eq.$VIDEO_ID&select=id,title" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Role: service_role")

ANALYSIS_CHECK=$(curl -s -X GET "$SUPABASE_URL/rest/v1/content_analysis?video_id=eq.$VIDEO_ID&select=id,analysis_completed" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Role: service_role")

echo "Vídeos encontrados: $VIDEOS_CHECK"
echo "Análises encontradas: $ANALYSIS_CHECK"

# 5. Testar generate-clips
echo "📝 4. Testando generate-clips..."
echo "Chamando função..."

RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/generate-clips" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\": \"$VIDEO_ID\"}")

echo "📄 Resposta da função:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# 6. Verificar clips criados
echo "📝 5. Verificando clips criados..."
CLIPS=$(curl -s -X GET "$SUPABASE_URL/rest/v1/clips?video_id=eq.$VIDEO_ID" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Role: service_role")

CLIPS_COUNT=$(echo "$CLIPS" | jq '. | length' 2>/dev/null || echo "0")
echo "📊 Clips encontrados: $CLIPS_COUNT"

if [ "$CLIPS_COUNT" -gt 0 ]; then
  echo "🎉 SUCESSO! Clips foram gerados:"
  echo "$CLIPS" | jq -r '.[] | "• " + .title + " (" + (.duration_seconds|tostring) + "s)"' 2>/dev/null || echo "$CLIPS"
else
  echo "❌ FALHA: Nenhum clip foi gerado"
  echo "Detalhes: $CLIPS"
fi

echo ""
echo "🔍 IDs para debug:"
echo "User ID: $USER_ID"
echo "Video ID: $VIDEO_ID"
echo "Analysis ID: $ANALYSIS_ID"

# 7. Reabilitar RLS (se necessário)
echo "📝 6. Reabilitando RLS..."
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/enable_rls_temp" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' || echo "Função RPC não existe (normal)"

echo "✅ Teste concluído!" 