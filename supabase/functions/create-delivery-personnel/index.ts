
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function creates a new user with the 'delivery_personnel' role
// and assigns them to a specific mess. It should only be callable by
// authenticated 'mess_owner' users, which should be enforced by RLS
// on the functions table or API gateway policies if available.
// For now, we rely on client-side role checks.

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, full_name, phone_number, mess_id } = await req.json();

    if (!email || !password || !full_name || !mess_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields: email, password, full_name, mess_id' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
      }
    )

    // Create a new user in Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        full_name,
        role: 'delivery_personnel'
      },
      // Set to true if you want users to confirm their email
      email_confirm: false, 
    })

    if (authError) {
        // Handle specific errors like user already exists
        if (authError.message.includes('User already registered')) {
            throw new Error('A user with this email already exists.');
        }
        throw authError;
    }
    if (!user) throw new Error('User creation failed for an unknown reason.');

    // The `handle_new_user` trigger automatically creates a profile.
    // We just need to update it with the mess_id and phone_number.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ mess_id: mess_id, phone_number: phone_number })
      .eq('id', user.id);

    if (profileError) {
      // If profile update fails, we should ideally delete the created auth user
      // to avoid orphaned users. This is a more advanced transactional pattern.
      console.error('Failed to update profile, but user was created:', user.id);
      throw profileError;
    }

    return new Response(JSON.stringify({ message: "User created and assigned successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
