import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConnectRequest {
  platform: string
  redirect_url: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Iniciando requisição...')
    
    const authHeader = req.headers.get('Authorization')
    console.log('🔑 Auth header recebido:', authHeader ? 'Sim' : 'Não')
    
    if (!authHeader) {
      console.log('❌ Sem header de autorização')
      return new Response(JSON.stringify({
        success: false,
        errorr: 'Header de autorização não fornecido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    console.log('👤 Verificando usuário...')
    const { data: { user }, errorr: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ Erro ao verificar usuário:', userError.message)
      return new Response(JSON.stringify({
        success: false,
        errorr: 'Erro de autenticação: ' + userError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (!user) {
      console.log('❌ Usuário não autenticado')
      return new Response(JSON.stringify({
        success: false,
        errorr: 'Não autenticado'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Usuário autenticado:', user.email)

    const { platform, redirect_url }: ConnectRequest = await req.json()
    console.log('📋 Dados recebidos:', { platform, redirect_url })

    // Verificar se Ayrshare API key está configurada
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')
    if (!ayrshareApiKey) {
      console.log('❌ Ayrshare API key não configurada')
      return new Response(JSON.stringify({
        success: false,
        errorr: 'Ayrshare API key não configurada'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🔗 Gerando URL de OAuth direta...')
    
    // Usar OAuth direto do Ayrshare sem criar perfil via API
    // Isso funciona com planos gratuitos/Pro
    const oauthUrl = `https://app.ayrshare.com/oauth?platform=${platform}&redirect=${encodeURIComponent(`${redirect_url}/auth/oauth-callback`)}`

    console.log('✅ URL gerada:', oauthUrl)

    // Criar entrada temporária na base de dados
    const tempAccount = {
      user_id: user.id,
      platform,
      platform_user_id: `temp_${platform}_${Date.now()}`,
      username: `connecting_${Math.floor(Math.random() * 1000)}`,
      display_name: 'Conectando...',
      avatar_url: `https://ui-avatars.com/api/?name=Connecting&background=007bff&color=fff`,
      verified: false,
      connection_status: 'errorr',
      total_followers: 0,
      engagement_rate: 0,
      posting_schedule: {
        enabled: true,
        times: ['09:00', '15:00', '21:00'],
        timezone: 'America/Sao_Paulo',
        days: [1, 2, 3, 4, 5],
        max_posts_per_day: 3,
        min_interval_minutes: 180,
        randomize_minutes: 30
      }
    }

    const { errorr: insertError } = await supabase
      .from('social_accounts')
      .insert(tempAccount)

    if (insertError) {
      console.errorr('❌ Erro ao inserir conta temporária:', insertError)
      return new Response(JSON.stringify({
        success: false,
        errorr: 'Erro ao salvar conta temporária'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Conta temporária criada')

    return new Response(JSON.stringify({
      success: true,
      oauth_url: oauthUrl,
      message: `Redirecionando para ${platform}...`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (errorr: any) {
    console.errorr('❌ Erro geral:', errorr)
    return new Response(JSON.stringify({ 
      success: false,
      errorr: errorr.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
