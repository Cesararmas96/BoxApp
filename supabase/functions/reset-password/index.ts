import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_PASSWORD = '12345678'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { user_id } = await req.json()

        if (!user_id) {
            throw new Error('user_id is required')
        }

        // 1. Reset the user's password via Auth Admin API
        const { error: authError } = await supabaseClient.auth.admin.updateUserById(user_id, {
            password: DEFAULT_PASSWORD,
        })

        if (authError) throw authError

        // 2. Flag the profile so the user is forced to change password on next login
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({ force_password_change: true })
            .eq('id', user_id)

        if (profileError) {
            console.warn('Could not set force_password_change flag:', profileError.message)
            // Non-blocking: password was already reset, flag is a nice-to-have
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
