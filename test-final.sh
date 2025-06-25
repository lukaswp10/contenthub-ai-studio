#!/bin/bash

echo "🎬 Teste Final - Generate Clips"
echo "==============================="
echo ""
echo "1. Abra o Supabase Studio: http://127.0.0.1:54323"
echo "2. Vá em 'SQL Editor'"
echo "3. Execute o arquivo: insert-test-data-simple.sql"
echo "4. Pressione ENTER aqui quando terminar..."
read

echo "📝 Testando função generate-clips..."
RESPONSE=$(curl -s -X POST "http://127.0.0.1:54321/functions/v1/generate-clips" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "22222222-2222-2222-2222-222222222222"}')

echo "📄 Resposta:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success": true'; then
  echo ""
  echo "🎉 SUCESSO! A função generate-clips está funcionando!"
  echo "✅ ClipsForge está pronto para uso!"
else
  echo ""
  echo "❌ Ainda há problemas. Verifique os logs acima."
fi

echo ""
echo "🔍 Para ver logs detalhados das functions:"
echo "Verifique o terminal onde está rodando 'supabase functions serve'" 