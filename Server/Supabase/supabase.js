import { createClient } from '@supabase/supabase-js'

process.loadEnvFile()

const customSupabaseFetch = async(url, options = {}) => {
    return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(3000)
    })
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const options = {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    },
    global: {fetch: customSupabaseFetch}
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);