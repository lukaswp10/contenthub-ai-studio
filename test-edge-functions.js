// Script para testar Edge Functions do Supabase
// Execute: node test-edge-functions.js

const SUPABASE_URL = 'https://rgwbtdzdeibobuveegfp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnd2J0ZHpkZWlib2J1dmVlZ2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjczNDIsImV4cCI6MjA2NTY0MzM0Mn0.f3ZdePT5fk6EuO-eP4fu4EBCN97V3mNxYAKU39sduGw'

async function testEdgeFunctions() {
  console.log('🧪 Testando Edge Functions...\n')

  // Teste 1: Verificar se a função connect-social-account existe e ver a resposta
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/connect-social-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'tiktok',
        redirect_url: 'https://contenthub-ai-studio.vercel.app/automation'
      })
    })

    console.log('📡 Teste connect-social-account:')
    console.log(`Status: ${response.status}`)
    
    // Tentar ler a resposta
    try {
      const responseText = await response.text()
      console.log('📄 Resposta completa:')
      console.log(responseText)
      
      // Tentar parsear como JSON
      try {
        const responseJson = JSON.parse(responseText)
        if (responseJson.oauth_url) {
          console.log('\n🔗 URL de OAuth retornada:')
          console.log(responseJson.oauth_url)
        }
      } catch (e) {
        console.log('❌ Resposta não é JSON válido')
      }
    } catch (e) {
      console.log('❌ Não foi possível ler a resposta')
    }
    
    if (response.status === 401) {
      console.log('✅ Função encontrada - Erro 401 esperado (não autenticado)')
    } else if (response.status === 404) {
      console.log('❌ Erro 404: Função não encontrada - NÃO DEPLOYADA')
    } else {
      console.log('✅ Função encontrada e respondendo')
    }
  } catch (error) {
    console.log('❌ Erro ao testar connect-social-account:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 2: Verificar se a função complete-oauth existe
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/complete-oauth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profile_key: 'test',
        platform: 'instagram'
      })
    })

    console.log('📡 Teste complete-oauth:')
    console.log(`Status: ${response.status}`)
    
    if (response.status === 401) {
      console.log('✅ Função encontrada - Erro 401 esperado (não autenticado)')
    } else if (response.status === 404) {
      console.log('❌ Erro 404: Função não encontrada - NÃO DEPLOYADA')
    } else {
      console.log('✅ Função encontrada e respondendo')
    }
  } catch (error) {
    console.log('❌ Erro ao testar complete-oauth:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // Teste 3: Verificar se a função refresh-social-account existe
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/refresh-social-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account_id: 'test'
      })
    })

    console.log('📡 Teste refresh-social-account:')
    console.log(`Status: ${response.status}`)
    
    if (response.status === 401) {
      console.log('✅ Função encontrada - Erro 401 esperado (não autenticado)')
    } else if (response.status === 404) {
      console.log('❌ Erro 404: Função não encontrada - NÃO DEPLOYADA')
    } else {
      console.log('✅ Função encontrada e respondendo')
    }
  } catch (error) {
    console.log('❌ Erro ao testar refresh-social-account:', error.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')
  console.log('📋 Resumo:')
  console.log('- Status 404 = Função NÃO deployada')
  console.log('- Status 401 = ✅ Função deployada (esperado sem autenticação)')
  console.log('- Status 200 = ✅ Função funcionando perfeitamente')
  console.log('\n🎯 Se todas as funções retornaram 401, elas estão deployadas!')
}

// Executar o teste
testEdgeFunctions() 