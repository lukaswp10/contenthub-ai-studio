import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v2 as cloudinary } from 'https://esm.sh/cloudinary@1.41.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateReelsRequest {
  video_id: string
  cloudinary_public_id: string
  preferences?: {
    reel_duration?: number // 15, 30, 60 seconds
    clip_count?: number // 2-5 clips per reel
    transition_style?: 'fade' | 'cut' | 'slide'
    add_music?: boolean
    add_subtitles?: boolean
    platform?: 'tiktok' | 'instagram' | 'youtube'
  }
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
      video_id, 
      cloudinary_public_id,
      preferences = {}
    }: GenerateReelsRequest = await req.json()

    console.log(`Generating reels for video ${video_id}`)

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME'),
      api_key: Deno.env.get('CLOUDINARY_API_KEY'),
      api_secret: Deno.env.get('CLOUDINARY_API_SECRET'),
    })

    // Get video details
    const { data: videoData } = await supabase
      .from('videos')
      .select('duration_seconds, title, ai_main_topics')
      .eq('id', video_id)
      .single()

    if (!videoData) throw new Error('Video não encontrado')

    // Get best clips for reels
    const { data: clips } = await supabase
      .from('clips')
      .select('*')
      .eq('video_id', video_id)
      .order('ai_viral_score', { ascending: false })
      .limit(10)

    if (!clips || clips.length === 0) {
      throw new Error('Nenhum clip encontrado para gerar reels')
    }

    const reelDuration = preferences.reel_duration || 30
    const clipCount = preferences.clip_count || 3
    const platform = preferences.platform || 'tiktok'

    console.log(`Creating ${clipCount} reels with ${reelDuration}s duration`)

    const createdReels = []
    const errors = []

    // Generate multiple reels with different clip combinations
    for (let reelIndex = 0; reelIndex < Math.min(5, clips.length); reelIndex++) {
      try {
        console.log(`Generating reel ${reelIndex + 1}`)
        
        // Select clips for this reel (different combinations)
        const selectedClips = clips.slice(reelIndex, reelIndex + clipCount)
        if (selectedClips.length < 2) break

        // Calculate timing for each clip
        const clipDuration = reelDuration / selectedClips.length
        const clipTimings = selectedClips.map((clip, index) => ({
          ...clip,
          reel_start: index * clipDuration,
          reel_end: (index + 1) * clipDuration,
          duration: clipDuration
        }))

        // Generate unique public_id for the reel
        const reelPublicId = `reels/${user.id}/${video_id}_reel_${reelIndex + 1}_${Date.now()}`

        // Build complex transformation for multi-clip reel
        const transformations = []
        
        // 1. Create overlay chain for multiple clips
        let overlayChain = cloudinary_public_id
        let currentTime = 0

        for (let i = 0; i < clipTimings.length; i++) {
          const clip = clipTimings[i]
          const clipTransform = [
            `so_${clip.start_time_seconds.toFixed(2)},eo_${clip.end_time_seconds.toFixed(2)}`,
            'c_fill',
            'w_1080',
            'h_1920',
            'g_center',
            'q_auto:best'
          ].join(',')

          if (i === 0) {
            // First clip - base
            overlayChain = `${cloudinary_public_id}/${clipTransform}`
          } else {
            // Subsequent clips - overlay with timing
            const overlayId = `${cloudinary_public_id}/${clipTransform}`
            const startOffset = (clip.reel_start * 30).toFixed(0) // Convert to frames (30fps)
            overlayChain = `${overlayChain}/l_video:${overlayId.replace(/\//g, ':')},so_${startOffset},eo_${(clip.reel_end * 30).toFixed(0)}`
          }
        }

        // 2. Final transformations for TikTok/Instagram
        transformations.push(
          'c_fill',
          'w_1080',
          'h_1920',
          'g_center',
          'q_auto:best',
          'f_mp4',
          'vc_h264',
          'ac_aac',
          'fl_attachment:reel'
        )

        // 3. Add platform-specific optimizations
        if (platform === 'tiktok') {
          transformations.push('du_30') // TikTok max 30s for most content
        } else if (platform === 'instagram') {
          transformations.push('du_60') // Instagram max 60s
        }

        // 4. Add transitions between clips
        if (preferences.transition_style === 'fade') {
          transformations.push('e_fade:2000') // 2s fade transition
        }

        // Build final transformation
        const transformation = transformations.join(',')

        // Generate reel URL using overlay chain
        const reelUrl = cloudinary.url(overlayChain, {
          resource_type: 'video',
          transformation: transformation,
          secure: true
        })

        // Generate thumbnail
        const thumbnailTransformations = [
          'so_5', // 5 seconds into the reel
          'c_fill',
          'w_480',
          'h_720',
          'g_center',
          'q_auto:best',
          'f_jpg'
        ]

        const thumbnailUrl = cloudinary.url(overlayChain, {
          resource_type: 'video',
          transformation: thumbnailTransformations.join(','),
          secure: true
        })

        // Create reel title and description
        const reelTitle = `Reel ${reelIndex + 1}: ${videoData.title}`
        const reelDescription = `🎬 ${selectedClips.length} clips combinados\n🔥 Score viral: ${(selectedClips.reduce((sum, c) => sum + c.ai_viral_score, 0) / selectedClips.length).toFixed(1)}/10\n📱 Otimizado para ${platform}`

        // Combine hashtags from all clips
        const allHashtags = [...new Set(selectedClips.flatMap(c => c.hashtags || []))].slice(0, 10)

        // Save reel to database
        const { data: reelData, error: reelError } = await supabase
          .from('reels')
          .insert({
            video_id,
            user_id: user.id,
            reel_number: reelIndex + 1,
            title: reelTitle,
            description: reelDescription,
            cloudinary_public_id: reelPublicId,
            cloudinary_secure_url: reelUrl,
            thumbnail_url: thumbnailUrl,
            duration_seconds: reelDuration,
            clip_count: selectedClips.length,
            platform: platform,
            hashtags: allHashtags,
            viral_score: selectedClips.reduce((sum, c) => sum + c.ai_viral_score, 0) / selectedClips.length,
            status: 'ready',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (reelError) {
          console.error(`Error saving reel ${reelIndex + 1}:`, reelError)
          errors.push({ reel: reelIndex + 1, error: reelError.message })
        } else {
          createdReels.push(reelData)
          console.log(`Reel ${reelIndex + 1} created successfully`)
        }

        // Small delay between reels
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (reelError: any) {
        console.error(`Error processing reel ${reelIndex + 1}:`, reelError)
        errors.push({ reel: reelIndex + 1, error: reelError.message })
      }
    }

    // Update video status
    await supabase
      .from('videos')
      .update({ 
        processing_status: 'ready',
        reels_generated: createdReels.length
      })
      .eq('id', video_id)

    console.log(`Reel generation completed: ${createdReels.length} reels created`)

    return new Response(JSON.stringify({
      success: true,
      video_id,
      reels_created: createdReels.length,
      reels: createdReels,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Reel generation error:', error)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 