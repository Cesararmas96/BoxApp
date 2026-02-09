import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, password, first_name, last_name, role_id, box_id } = await req.json()

        // 1. Check if user exists in Auth
        const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers()
        if (listError) throw listError

        let targetUser = users.find(u => u.email === email)
        let userId: string

        if (targetUser) {
            userId = targetUser.id
        } else {
            // Create the user in Auth if not exists
            const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    first_name,
                    last_name,
                    box_id,
                    role_id
                }
            })

            if (authError) throw authError
            userId = authData.user.id
            targetUser = authData.user
        }

        // 2. The profile might be created by a trigger, but we ensure it has force_password_change set
        // Wait for a second to ensure trigger finished (naive but effective if trigger exists)
        // or just upsert/update it.

        // Check if profile exists
        const { data: profileExists } = await supabaseClient
            .from('profiles')
            .select('id, box_id')
            .eq('id', userId)
            .single()

        if (profileExists) {
            // Check if user belongs to another box
            if (profileExists.box_id && profileExists.box_id !== box_id) {
                throw new Error('Este usuario ya está registrado en otro Box. El sistema actual solo permite un Box por usuario.')
            }

            // Update existing profile
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .update({
                    first_name,
                    last_name,
                    email,
                    role_id,
                    box_id,
                    status: 'active',
                    force_password_change: true
                })
                .eq('id', userId)
            if (profileError) throw profileError
        } else {
            // Create profile if not exists
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: userId,
                    first_name,
                    last_name,
                    email,
                    role_id,
                    box_id,
                    status: 'active',
                    force_password_change: true
                })
            if (profileError) throw profileError
        }

        return new Response(
            JSON.stringify({ user: targetUser }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
