import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  period?: 'day' | 'week' | 'month' | 'year'
  start_date?: string
  end_date?: string
  metrics?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📊 Iniciando analytics...')
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Header de autorização não fornecido'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuário não autenticado'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Usuário autenticado:', user.email)

    const { 
      period = 'month',
      start_date,
      end_date,
      metrics = ['all']
    }: AnalyticsRequest = await req.json().catch(() => ({}))

    // Calcular período de análise
    const endDate = end_date ? new Date(end_date) : new Date()
    let startDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    console.log(`📅 Período: ${startDate.toISOString()} - ${endDate.toISOString()}`)

    // 1. Estatísticas gerais de vídeos
    const { data: videosStats } = await supabase
      .from('videos')
      .select('id, created_at, duration_seconds, processing_status')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 2. Estatísticas de clips
    const { data: clipsStats } = await supabase
      .from('clips')
      .select('id, created_at, ai_viral_score, ai_best_platform, status, start_time_seconds, end_time_seconds')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 3. Estatísticas de posts sociais
    const { data: postsStats } = await supabase
      .from('social_posts')
      .select('id, created_at, platform, status, engagement_metrics')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 4. Contas sociais conectadas
    const { data: socialAccounts } = await supabase
      .from('social_accounts')
      .select('platform, connection_status, total_followers, engagement_rate')
      .eq('user_id', user.id)

    // Calcular métricas
    const totalVideos = videosStats?.length || 0
    const totalClips = clipsStats?.length || 0
    const totalPosts = postsStats?.length || 0
    const totalSocialAccounts = socialAccounts?.length || 0

    // Estatísticas de processamento
    const processedVideos = videosStats?.filter(v => v.processing_status === 'completed').length || 0
    const processingVideos = videosStats?.filter(v => v.processing_status === 'processing').length || 0
    const failedVideos = videosStats?.filter(v => v.processing_status === 'failed').length || 0

    // Estatísticas de clips por score
    const highScoreClips = clipsStats?.filter(c => c.ai_viral_score >= 8).length || 0
    const mediumScoreClips = clipsStats?.filter(c => c.ai_viral_score >= 6 && c.ai_viral_score < 8).length || 0
    const lowScoreClips = clipsStats?.filter(c => c.ai_viral_score < 6).length || 0

    // Plataformas mais recomendadas
    const platformRecommendations = clipsStats?.reduce((acc, clip) => {
      if (clip.ai_best_platform && Array.isArray(clip.ai_best_platform)) {
        clip.ai_best_platform.forEach((platform: string) => {
          acc[platform] = (acc[platform] || 0) + 1
        })
      }
      return acc
    }, {} as Record<string, number>) || {}

    // Status dos posts
    const publishedPosts = postsStats?.filter(p => p.status === 'published').length || 0
    const scheduledPosts = postsStats?.filter(p => p.status === 'scheduled').length || 0
    const failedPosts = postsStats?.filter(p => p.status === 'failed').length || 0

    // Engagement total
    const totalEngagement = postsStats?.reduce((acc, post) => {
      if (post.engagement_metrics) {
        const metrics = post.engagement_metrics as any
        return acc + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)
      }
      return acc
    }, 0) || 0

    // Dados para gráficos (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const dailyStats = last7Days.map(date => {
      const dayStart = new Date(date + 'T00:00:00Z')
      const dayEnd = new Date(date + 'T23:59:59Z')
      
      const videosCount = videosStats?.filter(v => {
        const created = new Date(v.created_at)
        return created >= dayStart && created <= dayEnd
      }).length || 0

      const clipsCount = clipsStats?.filter(c => {
        const created = new Date(c.created_at)
        return created >= dayStart && created <= dayEnd
      }).length || 0

      const postsCount = postsStats?.filter(p => {
        const created = new Date(p.created_at)
        return created >= dayStart && created <= dayEnd
      }).length || 0

      return {
        date,
        videos: videosCount,
        clips: clipsCount,
        posts: postsCount
      }
    })

    // Tempo médio de duração dos vídeos
    const avgVideoDuration = videosStats?.length ? 
      videosStats.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) / videosStats.length : 0

    // Tempo médio dos clips
    const avgClipDuration = clipsStats?.length ?
      clipsStats.reduce((acc, c) => acc + ((c.end_time_seconds || 0) - (c.start_time_seconds || 0)), 0) / clipsStats.length : 0

    const analytics = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      },
      overview: {
        total_videos: totalVideos,
        total_clips: totalClips,
        total_posts: totalPosts,
        total_social_accounts: totalSocialAccounts,
        total_engagement: totalEngagement,
        avg_video_duration: Math.round(avgVideoDuration),
        avg_clip_duration: Math.round(avgClipDuration)
      },
      videos: {
        processed: processedVideos,
        processing: processingVideos,
        failed: failedVideos,
        success_rate: totalVideos > 0 ? Math.round((processedVideos / totalVideos) * 100) : 0
      },
      clips: {
        high_score: highScoreClips,
        medium_score: mediumScoreClips,
        low_score: lowScoreClips,
        avg_score: clipsStats?.length ? 
          Math.round((clipsStats.reduce((acc, c) => acc + (c.ai_viral_score || 0), 0) / clipsStats.length) * 10) / 10 : 0
      },
      posts: {
        published: publishedPosts,
        scheduled: scheduledPosts,
        failed: failedPosts,
        success_rate: totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0
      },
      platforms: {
        recommendations: platformRecommendations,
        connected_accounts: socialAccounts?.reduce((acc, account) => {
          acc[account.platform] = {
            status: account.connection_status,
            followers: account.total_followers || 0,
            engagement_rate: account.engagement_rate || 0
          }
          return acc
        }, {} as Record<string, any>) || {}
      },
      charts: {
        daily_activity: dailyStats,
        platform_distribution: Object.entries(platformRecommendations).map(([platform, count]) => ({
          platform,
          count
        })),
        score_distribution: [
          { range: '8-10', count: highScoreClips, color: '#10b981' },
          { range: '6-8', count: mediumScoreClips, color: '#f59e0b' },
          { range: '0-6', count: lowScoreClips, color: '#ef4444' }
        ]
      }
    }

    console.log('✅ Analytics calculado')

    return new Response(JSON.stringify({
      success: true,
      analytics,
      generated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ Erro no analytics:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 