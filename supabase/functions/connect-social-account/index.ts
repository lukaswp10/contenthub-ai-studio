
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
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { platform, redirect_url }: ConnectRequest = await req.json()

    console.log(`Conectando plataforma ${platform} para usuário ${user.id}`)

    // Verificar limites do plano
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single()

    const { count: currentCount } = await supabase
      .from('social_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('platform', platform)

    const platformLimits = {
      free: { tiktok: 1, instagram: 1, youtube: 0, twitter: 0, linkedin: 0, facebook: 1 },
      pro: { tiktok: 5, instagram: 5, youtube: 3, twitter: 3, linkedin: 2, facebook: 3 },
      agency: { tiktok: 20, instagram: 20, youtube: 10, twitter: 10, linkedin: 5, facebook: 10 }
    }

    const maxAllowed = platformLimits[profile?.plan_type as keyof typeof platformLimits]?.[platform as keyof typeof platformLimits.free] || 0
    
    if ((currentCount || 0) >= maxAllowed) {
      throw new Error(`Limite de contas ${platform} atingido para o plano ${profile?.plan_type}`)
    }

    // Usar Ayrshare para conectar conta real
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')
    if (!ayrshareApiKey) {
      throw new Error('Ayrshare API key não configurada')
    }

    // Criar perfil no Ayrshare
    const profileResponse = await fetch('https://app.ayrshare.com/api/profiles/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ayrshareApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `${user.email}_${platform}_${Date.now()}`,
        disableSocial: Object.keys(platformLimits.free).filter(p => p !== platform)
      })
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('Ayrshare profile creation error:', errorText)
      throw new Error(`Erro ao criar perfil no Ayrshare: ${errorText}`)
    }

    const profileData = await profileResponse.json()
    const profileKey = profileData.profileKey

    if (!profileKey) {
      throw new Error('Profile key não retornado pelo Ayrshare')
    }

    // Gerar URL de OAuth para conta real
    const oauthUrl = `https://app.ayrshare.com/oauth?platform=${platform}&profileKey=${profileKey}&redirect=${encodeURIComponent(redirect_url)}`

    console.log(`OAuth URL gerada: ${oauthUrl}`)

    // Criar entrada temporária na base de dados (será atualizada após OAuth)
    const tempAccount = {
      user_id: user.id,
      platform,
      platform_user_id: `temp_${platform}_${Date.now()}`,
      username: `connecting_${Math.floor(Math.random() * 1000)}`,
      display_name: 'Conectando...',
      avatar_url: `https://ui-avatars.com/api/?name=Connecting&background=007bff&color=fff`,
      verified: false,
      ayrshare_profile_key: profileKey,
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
      console.error('Erro ao inserir conta temporária:', insertError)
      throw insertError
    }

    console.log(`Conta ${platform} em processo de conexão para usuário ${user.id}`)

    return new Response(JSON.stringify({
      success: true,
      oauth_url: oauthUrl,
      profile_key: profileKey,
      message: `Redirecionando para ${platform}...`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Connect social account error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
