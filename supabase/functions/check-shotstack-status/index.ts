import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para verificar status do render Shotstack
async function checkShotstackRender(renderId: string) {
  // Usar a chave de produção por padrão, fallback para sandbox
  const SHOTSTACK_PRODUCTION_KEY = Deno.env.get('SHOTSTACK_PRODUCTION_API_KEY')
  const SHOTSTACK_SANDBOX_KEY = Deno.env.get('SHOTSTACK_SANDBOX_API_KEY')
  
  const API_KEY = SHOTSTACK_PRODUCTION_KEY || SHOTSTACK_SANDBOX_KEY
  const BASE_URL = SHOTSTACK_PRODUCTION_KEY 
    ? 'https://api.shotstack.io/edit/render' 
    : 'https://api.shotstack.io/edit/stage/render'
  
  const SHOTSTACK_STATUS_URL = `${BASE_URL}/${renderId}`
  
  if (!API_KEY) {
    console.error('❌ Nenhuma chave Shotstack configurada')
    return null
  }

  try {
    console.log(`🔍 Verificando status do render: ${renderId}`)
    console.log(`🌐 URL: ${SHOTSTACK_STATUS_URL}`)
    
    const response = await fetch(SHOTSTACK_STATUS_URL, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Erro ao verificar render ${renderId}:`, response.status, response.statusText)
      const errorText = await response.text()
      console.error('❌ Detalhes do erro:', errorText)
      return null
    }

    const result = await response.json()
    console.log(`📊 Resposta completa do Shotstack:`, JSON.stringify(result, null, 2))
    
    // A resposta pode vir diretamente ou dentro de 'response'
    const renderData = result.response || result
    console.log(`📊 Status do render ${renderId}:`, renderData.status)
    
    return renderData

  } catch (error) {
    console.error('❌ Erro ao verificar status Shotstack:', error)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔧 Iniciando verificação de status Shotstack')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar clips que estão processando no Shotstack
    const { data: processingClips, error: fetchError } = await supabaseClient
      .from('clips')
      .select('*')
      .eq('status', 'processing')
      .not('shotstack_render_id', 'is', null)

    if (fetchError) {
      console.error('❌ Erro ao buscar clips processando:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar clips processando' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!processingClips || processingClips.length === 0) {
      console.log('ℹ️ Nenhum clip em processamento encontrado')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum clip em processamento',
          clips_checked: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🎬 Verificando ${processingClips.length} clips em processamento`)

    const updatedClips = []
    let completedCount = 0
    let failedCount = 0

    // Verificar status de cada clip
    for (const clip of processingClips) {
      try {
        const renderStatus = await checkShotstackRender(clip.shotstack_render_id)
        
        if (!renderStatus) {
          console.warn(`⚠️ Não foi possível verificar status do clip ${clip.id}`)
          continue
        }

        let updateData: any = {}
        let shouldUpdate = false

        switch (renderStatus.status) {
          case 'done':
            console.log(`✅ Clip ${clip.id} concluído: ${renderStatus.url}`)
            updateData = {
              status: 'ready',
              cloudinary_secure_url: renderStatus.url,
              shotstack_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            shouldUpdate = true
            completedCount++
            break

          case 'failed':
            console.error(`❌ Clip ${clip.id} falhou no Shotstack`)
            // Fallback para URL simples do Cloudinary
            const { data: videoData } = await supabaseClient
              .from('videos')
              .select('cloudinary_secure_url')
              .eq('id', clip.video_id)
              .single()

            if (videoData) {
              const fallbackUrl = videoData.cloudinary_secure_url.replace(
                '/upload/',
                `/upload/so_${clip.start_time_seconds},eo_${clip.end_time_seconds}/`
              )
              
              updateData = {
                status: 'ready',
                cloudinary_secure_url: fallbackUrl,
                shotstack_error: renderStatus.error || 'Render failed',
                updated_at: new Date().toISOString()
              }
              shouldUpdate = true
              failedCount++
            }
            break

          case 'rendering':
          case 'queued':
            console.log(`⏳ Clip ${clip.id} ainda processando: ${renderStatus.status}`)
            // Não atualiza, mantém status atual
            break

          default:
            console.warn(`⚠️ Status desconhecido para clip ${clip.id}: ${renderStatus.status}`)
        }

        if (shouldUpdate) {
          const { error: updateError } = await supabaseClient
            .from('clips')
            .update(updateData)
            .eq('id', clip.id)

          if (updateError) {
            console.error(`❌ Erro ao atualizar clip ${clip.id}:`, updateError)
          } else {
            console.log(`✅ Clip ${clip.id} atualizado com sucesso`)
            updatedClips.push({
              id: clip.id,
              title: clip.title,
              status: updateData.status,
              url: updateData.cloudinary_secure_url
            })
          }
        }

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`❌ Erro ao processar clip ${clip.id}:`, error)
        continue
      }
    }

    console.log(`🎉 Verificação concluída: ${completedCount} concluídos, ${failedCount} falharam`)

    return new Response(
      JSON.stringify({
        success: true,
        clips_checked: processingClips.length,
        clips_completed: completedCount,
        clips_failed: failedCount,
        updated_clips: updatedClips
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro geral na verificação:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: {
          stack: error.stack,
          name: error.name
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 