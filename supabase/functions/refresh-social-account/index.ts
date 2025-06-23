
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefreshRequest {
  account_id: string
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

    const { account_id }: RefreshRequest = await req.json()

    console.log(`Atualizando conta ${account_id} para usuário ${user.id}`)

    // Verificar se a conta pertence ao usuário
    const { data: account, error: fetchError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !account) {
      throw new Error('Conta não encontrada')
    }

    // Atualizar status da conta (simulado)
    const { error: updateError } = await supabase
      .from('social_accounts')
      .update({
        connection_status: 'connected',
        last_refreshed_at: new Date().toISOString(),
        last_error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', account_id)

    if (updateError) {
      console.error('Erro ao atualizar conta:', updateError)
      throw updateError
    }

    console.log(`Conta ${account_id} atualizada com sucesso`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Conta atualizada com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Refresh social account error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
