
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

    // Para demo, criar conta mock diretamente
    const mockAccount = {
      user_id: user.id,
      platform,
      platform_user_id: `demo_${platform}_${Date.now()}`,
      username: `demo_user_${Math.floor(Math.random() * 1000)}`,
      display_name: 'Demo User',
      avatar_url: `https://ui-avatars.com/api/?name=Demo+User&background=random`,
      verified: Math.random() > 0.5,
      total_followers: Math.floor(Math.random() * 10000),
      engagement_rate: Math.random() * 10,
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
      .insert(mockAccount)

    if (insertError) {
      console.error('Erro ao inserir conta:', insertError)
      throw insertError
    }

    console.log(`Conta ${platform} criada com sucesso para usuário ${user.id}`)

    return new Response(JSON.stringify({
      success: true,
      oauth_url: `https://demo-oauth.com/${platform}`,
      account: mockAccount
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
