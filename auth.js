// auth.js
// Initialize and export a Supabase client safely.
// Usage:
// import { initSupabase, getSupabase } from './auth.js'
// initSupabase({ supabaseUrl: 'https://...', supabaseAnonKey: 'anon-key' })

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

let supabase = null

export function initSupabase({ supabaseUrl, supabaseAnonKey } = {}) {
	const url = supabaseUrl || (typeof window !== 'undefined' && window.SUPABASE_URL) || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL)
	const key = supabaseAnonKey || (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY)

	if (!url || !key) {
		throw new Error('Supabase initialization requires SUPABASE_URL and SUPABASE_ANON_KEY')
	}

	supabase = createClient(url, key)
	return supabase
}

export function getSupabase() {
	if (!supabase) throw new Error('Supabase client not initialized. Call initSupabase() first.')
	return supabase
}

export default { initSupabase, getSupabase }
