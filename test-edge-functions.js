// Script para testar Edge Functions do Supabase
// Execute: node test-edge-functions.js

const SUPABASE_URL = 'https://rgwbtdzdeibobuveegfp.supabase.co'
const SUPABASE_ANON_KEY = 'sua_chave_anonima_aqui' // Substitua pela sua chave

async function testEdgeFunctions() {
  console.log('🧪 Testando Edge Functions...\n')

  // Teste 1: Verificar se a função connect-social-account existe
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/connect-social-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'instagram',
        redirect_url: 'https://contenthub-ai-studio.vercel.app'
      })
    })

    console.log('📡 Teste connect-social-account:')
    console.log(`Status: ${response.status}`)
    
    if (response.status === 401) {
      console.log('❌ Erro 401: Não autenticado (esperado sem login)')
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
      console.log('❌ Erro 401: Não autenticado (esperado sem login)')
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
      console.log('❌ Erro 401: Não autenticado (esperado sem login)')
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
  console.log('- Status 401 = Função deployada (mas precisa autenticação)')
  console.log('- Status 200 = Função funcionando perfeitamente')
}

// Executar o teste
testEdgeFunctions() 