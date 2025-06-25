#!/bin/bash

# Script para testar generate-clips com dados mock
set -e

echo "🎬 Teste Generate-Clips (Mock Data)"
echo "==================================="

# Configurações
SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# ID de teste
VIDEO_ID="22222222-2222-2222-2222-222222222222"

echo "Video ID: $VIDEO_ID"
echo ""

# 1. Criar uma versão mock da função temporariamente
echo "📝 1. Criando versão mock da função..."

cat > supabase/functions/generate-clips/index-mock.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { video_id } = await req.json()
    
    console.log(`🎬 [MOCK] Gerando clips para video: ${video_id}`)
    
    // Simular dados mock
    const mockClips = [
      {
        id: "clip-1",
        title: "Clip Viral Incrível",
        duration_seconds: 30,
        ai_viral_score: 8.5,
        url: "https://mock-url.com/clip1.mp4"
      },
      {
        id: "clip-2", 
        title: "Momento Épico",
        duration_seconds: 25,
        ai_viral_score: 7.8,
        url: "https://mock-url.com/clip2.mp4"
      }
    ]
    
    console.log(`🎉 [MOCK] Geração concluída: ${mockClips.length} clips criados`)

    return new Response(
      JSON.stringify({
        success: true,
        clips_generated: mockClips.length,
        clips: mockClips,
        mock: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [MOCK] Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
EOF

# Backup da função original
cp supabase/functions/generate-clips/index.ts supabase/functions/generate-clips/index-original.ts

# Usar a versão mock
cp supabase/functions/generate-clips/index-mock.ts supabase/functions/generate-clips/index.ts

echo "✅ Função mock criada"

# 2. Aguardar um pouco para o reload
echo "📝 2. Aguardando reload das functions..."
sleep 3

# 3. Testar a função mock
echo "📝 3. Testando função mock..."
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/generate-clips" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"video_id\": \"$VIDEO_ID\"}")

echo "📄 Resposta da função mock:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# 4. Restaurar função original
echo "📝 4. Restaurando função original..."
cp supabase/functions/generate-clips/index-original.ts supabase/functions/generate-clips/index.ts
rm supabase/functions/generate-clips/index-mock.ts
rm supabase/functions/generate-clips/index-original.ts

echo "✅ Função original restaurada"

# Verificar se a função mock funcionou
if echo "$RESPONSE" | grep -q '"mock": true'; then
  echo "🎉 SUCESSO! A função mock funcionou corretamente"
  echo "Isso significa que o problema é com o acesso aos dados, não com a função em si"
else
  echo "❌ FALHA: Até a função mock não funcionou"
  echo "Pode haver um problema com as edge functions"
fi

echo ""
echo "✅ Teste mock concluído!" 