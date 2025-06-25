import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SchedulePostRequest {
  clip_id: string
  social_account_ids: string[]
  post_title?: string
  post_description?: string
  hashtags: string[]
  mentions?: string[]
  schedule_type: 'now' | 'optimal' | 'custom'
  custom_datetime?: string
  publish_immediately?: boolean
}

interface AyrsharePostData {
  post: string
  platforms: string[]
  mediaUrls: string[]
  profileKeys: string[]
  scheduleDate?: string
  shortenLinks?: boolean
  hashtags?: string[]
  isVideo?: boolean
  thumbnailUrl?: string
  autoHashtag?: boolean
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

    const { 
      clip_id, 
      social_account_ids, 
      post_title, 
      post_description,
      hashtags, 
      mentions = [],
      schedule_type,
      custom_datetime,
      publish_immediately = false
    }: SchedulePostRequest = await req.json()

    console.log(`Scheduling post for clip ${clip_id} to ${social_account_ids.length} accounts`)

    // Fetch clip details
    const { data: clip, errorr: clipError } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clip_id)
      .eq('user_id', user.id)
      .single()

    if (clipError || !clip) throw new Error('Clip não encontrado')

    // Fetch social accounts
    const { data: socialAccounts, errorr: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .in('id', social_account_ids)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (accountsError || !socialAccounts?.length) {
      throw new Error('Nenhuma conta social válida encontrada')
    }

    console.log(`Found ${socialAccounts.length} valid social accounts`)

    const scheduledPosts = []
    const errorrs = []
    
    // Group accounts by platform for batch posting
    const accountsByPlatform = socialAccounts.reduce((acc, account) => {
      if (!acc[account.platform]) {
        acc[account.platform] = []
      }
      acc[account.platform].push(account)
      return acc
    }, {} as Record<string, typeof socialAccounts>)

    // Process each platform group
    for (const [platform, accounts] of Object.entries(accountsByPlatform)) {
      try {
        // Calculate posting time for this platform
        let scheduledTime: Date
        
        if (schedule_type === 'now' || publish_immediately) {
          scheduledTime = new Date()
        } else if (schedule_type === 'custom' && custom_datetime) {
          scheduledTime = new Date(custom_datetime)
        } else if (schedule_type === 'optimal') {
          scheduledTime = calculateOptimalPostTime(accounts[0], clip, platform)
        } else {
          scheduledTime = new Date() // Default to now
        }

        // Check rate limits for each account
        for (const account of accounts) {
          const canPost = await checkPostingLimits(supabase, account, scheduledTime)
          if (!canPost.allowed) {
            errorrs.push({
              account_id: account.id,
              errorr: canPost.reason
            })
            continue
          }

          // Build post content
          const postContent = buildPostContent({
            title: post_title || clip.title,
            description: post_description,
            hashtags: [...new Set([...hashtags, ...(account.default_hashtags || [])])],
            mentions,
            platform,
            maxLength: getPlatformMaxLength(platform)
          })

          // Prepare Ayrshare data
          const ayrshareData: AyrsharePostData = {
            post: postContent,
            platforms: [mapPlatformToAyrshare(platform)],
            mediaUrls: [clip.cloudinary_secure_url],
            profileKeys: [account.ayrshare_profile_key!],
            isVideo: true,
            thumbnailUrl: clip.thumbnail_url,
            autoHashtag: false, // We handle hashtags ourselves
            shortenLinks: true
          }

          // Add schedule if not immediate
          if (!publish_immediately && schedule_type !== 'now') {
            ayrshareData.scheduleDate = scheduledTime.toISOString()
          }

          // Save post record first
          const { data: postRecord, errorr: postError } = await supabase
            .from('social_posts')
            .insert({
              clip_id: clip.id,
              social_account_id: account.id,
              user_id: user.id,
              post_title: post_title || clip.title,
              post_description: postContent,
              hashtags,
              mentions,
              scheduled_for: scheduledTime,
              publish_immediately,
              media_url: clip.cloudinary_secure_url,
              thumbnail_url: clip.thumbnail_url,
              platform_specific_data: {
                format: 'video',
                duration: clip.duration_seconds,
                aspect_ratio: '9:16'
              },
              status: publish_immediately ? 'posting' : 'scheduled'
            })
            .select()
            .single()

          if (postError) {
            console.errorr('Error creating post record:', postError)
            errorrs.push({
              account_id: account.id,
              errorr: postError.message
            })
            continue
          }

          // Call Ayrshare API for immediate posts
          if (publish_immediately || schedule_type === 'now') {
            try {
              const ayrshareResponse = await fetch('https://app.ayrshare.com/api/post', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('AYRSHARE_API_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(ayrshareData)
              })

              if (!ayrshareResponse.ok) {
                const errorrData = await ayrshareResponse.text()
                throw new Error(`Ayrshare API errorr: ${errorrData}`)
              }

              const ayrshareResult = await ayrshareResponse.json()
              console.log('Ayrshare post result:', ayrshareResult)

              // Update post with Ayrshare response
              await supabase
                .from('social_posts')
                .update({
                  ayrshare_post_id: ayrshareResult.id,
                  platform_post_id: ayrshareResult.postIds?.[platform],
                  platform_post_url: ayrshareResult.urls?.[platform],
                  status: 'posted',
                  posted_at: new Date().toISOString()
                })
                .eq('id', postRecord.id)

              // Update account stats
              await updateAccountPostStats(supabase, account.id)

            } catch (postError: any) {
              console.errorr('Ayrshare post errorr:', postError)
              
              // Update post status to failed
              await supabase
                .from('social_posts')
                .update({
                  status: 'failed',
                  failure_reason: postError.message
                })
                .eq('id', postRecord.id)

              errorrs.push({
                account_id: account.id,
                errorr: postError.message
              })
              continue
            }
          } else {
            // For scheduled posts, create Ayrshare schedule
            try {
              const ayrshareResponse = await fetch('https://app.ayrshare.com/api/post', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('AYRSHARE_API_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  ...ayrshareData,
                  scheduleDate: scheduledTime.toISOString()
                })
              })

              if (!ayrshareResponse.ok) {
                const errorrData = await ayrshareResponse.text()
                throw new Error(`Ayrshare schedule errorr: ${errorrData}`)
              }

              const ayrshareResult = await ayrshareResponse.json()
              
              // Update post with schedule ID
              await supabase
                .from('social_posts')
                .update({
                  ayrshare_post_id: ayrshareResult.id,
                  status: 'scheduled'
                })
                .eq('id', postRecord.id)

            } catch (scheduleError: any) {
              console.errorr('Ayrshare schedule errorr:', scheduleError)
              
              // Keep post as scheduled locally even if Ayrshare fails
              // We'll retry via cron job
              await supabase
                .from('social_posts')
                .update({
                  status: 'scheduled',
                  failure_reason: `Ayrshare schedule pending: ${scheduleError.message}`
                })
                .eq('id', postRecord.id)
            }
          }

          scheduledPosts.push({
            ...postRecord,
            account_info: {
              platform: account.platform,
              username: account.username,
              display_name: account.display_name
            }
          })
        }

      } catch (platformError: any) {
        console.errorr(`Error processing platform ${platform}:`, platformError)
        errorrs.push({
          platform,
          errorr: platformError.message
        })
      }
    }

    // Update clip stats
    await supabase
      .from('clips')
      .update({
        total_posts: clip.total_posts + scheduledPosts.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', clip_id)

    console.log(`Scheduled ${scheduledPosts.length} posts, ${errorrs.length} errorrs`)

    return new Response(JSON.stringify({
      success: true,
      clip_id,
      posts_scheduled: scheduledPosts.length,
      posts_failed: errorrs.length,
      scheduled_posts: scheduledPosts,
      errorrs: errorrs.length > 0 ? errorrs : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (errorr: any) {
    console.errorr('Schedule post errorr:', errorr)
    
    return new Response(JSON.stringify({ 
      success: false,
      errorr: errorr.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper functions
function calculateOptimalPostTime(account: any, clip: any, platform: string): Date {
  const now = new Date()
  const schedule = account.posting_schedule
  
  // Platform-specific optimal times
  const platformOptimalHours = {
    tiktok: [6, 10, 19, 22],
    instagram: [8, 12, 17, 20],
    youtube: [14, 16, 20],
    twitter: [9, 12, 15, 18],
    linkedin: [8, 12, 17],
    facebook: [9, 13, 16, 20]
  }

  const optimalHours = platformOptimalHours[platform as keyof typeof platformOptimalHours] || [12]
  
  // Find next available optimal hour
  const currentHour = now.getHours()
  let targetHour = optimalHours.find(h => h > currentHour) || optimalHours[0]
  let targetDate = new Date(now)
  
  if (targetHour <= currentHour) {
    // Move to next day
    targetDate.setDate(targetDate.getDate() + 1)
  }
  
  targetDate.setHours(targetHour, 0, 0, 0)
  
  // Add randomization if configured
  if (schedule.randomize_minutes > 0) {
    const randomMinutes = Math.floor(Math.random() * schedule.randomize_minutes)
    targetDate.setMinutes(randomMinutes)
  }
  
  return targetDate
}

async function checkPostingLimits(
  supabase: any, 
  account: any, 
  scheduledTime: Date
): Promise<{ allowed: boolean; reason?: string }> {
  // Check daily limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: todayPosts } = await supabase
    .from('social_posts')
    .select('*', { count: 'exact', head: true })
    .eq('social_account_id', account.id)
    .gte('scheduled_for', today.toISOString())
    .lt('scheduled_for', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())

  if (todayPosts >= account.posting_schedule.max_posts_per_day) {
    return { 
      allowed: false, 
      reason: `Limite diário de ${account.posting_schedule.max_posts_per_day} posts atingido` 
    }
  }

  // Check minimum interval
  const minInterval = account.posting_schedule.min_interval_minutes * 60 * 1000
  const intervalStart = new Date(scheduledTime.getTime() - minInterval)
  const intervalEnd = new Date(scheduledTime.getTime() + minInterval)
  
  const { data: nearbyPosts } = await supabase
    .from('social_posts')
    .select('scheduled_for')
    .eq('social_account_id', account.id)
    .gte('scheduled_for', intervalStart.toISOString())
    .lte('scheduled_for', intervalEnd.toISOString())
    .neq('status', 'cancelled')

  if (nearbyPosts && nearbyPosts.length > 0) {
    return { 
      allowed: false, 
      reason: `Respeite o intervalo mínimo de ${account.posting_schedule.min_interval_minutes} minutos entre posts` 
    }
  }

  return { allowed: true }
}

function buildPostContent(options: {
  title: string
  description?: string
  hashtags: string[]
  mentions: string[]
  platform: string
  maxLength: number
}): string {
  const { title, description, hashtags, mentions, platform, maxLength } = options
  
  let content = title
  
  if (description) {
    content += `\n\n${description}`
  }
  
  // Add mentions
  if (mentions.length > 0) {
    content += '\n\n' + mentions.map(m => `@${m}`).join(' ')
  }
  
  // Add hashtags
  if (hashtags.length > 0) {
    const hashtagsText = '\n\n' + hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
    
    // Check if content + hashtags exceeds limit
    if (content.length + hashtagsText.length <= maxLength) {
      content += hashtagsText
    } else {
      // Add as many hashtags as possible
      const availableSpace = maxLength - content.length - 10 // Leave some buffer
      let hashtagsToAdd = ''
      
      for (const hashtag of hashtags) {
        const tag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`
        if (hashtagsToAdd.length + tag.length + 1 <= availableSpace) {
          hashtagsToAdd += (hashtagsToAdd ? ' ' : '') + tag
        } else {
          break
        }
      }
      
      if (hashtagsToAdd) {
        content += '\n\n' + hashtagsToAdd
      }
    }
  }
  
  // Truncate if still too long
  if (content.length > maxLength) {
    content = content.substring(0, maxLength - 3) + '...'
  }
  
  return content
}

function getPlatformMaxLength(platform: string): number {
  const limits = {
    twitter: 280,
    linkedin: 3000,
    facebook: 5000,
    instagram: 2200,
    tiktok: 2200,
    youtube: 5000
  }
  return limits[platform as keyof typeof limits] || 2000
}

function mapPlatformToAyrshare(platform: string): string {
  // Map our platform names to Ayrshare's expected values
  const mapping = {
    twitter: 'twitter',
    instagram: 'instagram',
    facebook: 'facebook',
    linkedin: 'linkedin',
    youtube: 'youtube',
    tiktok: 'tiktok'
  }
  return mapping[platform as keyof typeof mapping] || platform
}

async function updateAccountPostStats(supabase: any, accountId: string) {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  await supabase
    .from('social_accounts')
    .update({
      posts_today: supabase.raw('posts_today + 1'),
      posts_this_hour: supabase.raw('posts_this_hour + 1'),
      last_posted_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', accountId)
} 