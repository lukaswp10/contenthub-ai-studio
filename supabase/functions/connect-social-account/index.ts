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
        error: 'Header de autorização não fornecido'
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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ Erro ao verificar usuário:', userError.message)
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro de autenticação: ' + userError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (!user) {
      console.log('❌ Usuário não autenticado')
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuário não autenticado'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Usuário autenticado:', user.email)

    const { platform, redirect_url }: ConnectRequest = await req.json()
    console.log('📋 Dados recebidos:', { platform, redirect_url })

    // Validar plataforma
    const supportedPlatforms = ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin']
    if (!supportedPlatforms.includes(platform.toLowerCase())) {
      return new Response(JSON.stringify({
        success: false,
        error: `Plataforma não suportada: ${platform}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🔗 Gerando URL de OAuth...')
    
    // URL de OAuth personalizada para cada plataforma
    let oauthUrl = ''
    const baseRedirect = `${redirect_url}/auth/social-callback`
    
    switch (platform.toLowerCase()) {
      case 'instagram':
        oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${Deno.env.get('INSTAGRAM_CLIENT_ID')}&redirect_uri=${encodeURIComponent(baseRedirect)}&scope=user_profile,user_media&response_type=code&state=${platform}`
        break
      case 'tiktok':
        oauthUrl = `https://www.tiktok.com/auth/authorize/?client_key=${Deno.env.get('TIKTOK_CLIENT_KEY')}&response_type=code&scope=user.info.basic,video.list&redirect_uri=${encodeURIComponent(baseRedirect)}&state=${platform}`
        break
      case 'youtube':
        oauthUrl = `https://accounts.google.com/oauth2/auth?client_id=${Deno.env.get('YOUTUBE_CLIENT_ID')}&redirect_uri=${encodeURIComponent(baseRedirect)}&scope=https://www.googleapis.com/auth/youtube.upload&response_type=code&state=${platform}`
        break
      case 'facebook':
        oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${Deno.env.get('FACEBOOK_CLIENT_ID')}&redirect_uri=${encodeURIComponent(baseRedirect)}&scope=pages_manage_posts,pages_read_engagement&response_type=code&state=${platform}`
        break
      case 'twitter':
        // Twitter OAuth 2.0
        oauthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${Deno.env.get('TWITTER_CLIENT_ID')}&redirect_uri=${encodeURIComponent(baseRedirect)}&scope=tweet.read%20tweet.write%20users.read&state=${platform}&code_challenge=challenge&code_challenge_method=plain`
        break
      case 'linkedin':
        oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${Deno.env.get('LINKEDIN_CLIENT_ID')}&redirect_uri=${encodeURIComponent(baseRedirect)}&scope=r_liteprofile%20w_member_social&state=${platform}`
        break
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Plataforma não configurada'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    console.log('✅ URL gerada para', platform)

    // Criar entrada temporária na base de dados
    const tempAccount = {
      user_id: user.id,
      platform: platform.toLowerCase(),
      platform_user_id: `temp_${platform}_${Date.now()}`,
      username: `conectando_${Math.floor(Math.random() * 1000)}`,
      display_name: 'Conectando...',
      avatar_url: `https://ui-avatars.com/api/?name=${platform}&background=007bff&color=fff`,
      verified: false,
      connection_status: 'connecting',
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

    const { error: insertError } = await supabase
      .from('social_accounts')
      .insert(tempAccount)

    if (insertError) {
      console.error('❌ Erro ao inserir conta temporária:', insertError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao salvar conta temporária'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Conta temporária criada')

    return new Response(JSON.stringify({
      success: true,
      oauth_url: oauthUrl,
      platform,
      message: `Redirecionando para ${platform}...`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
