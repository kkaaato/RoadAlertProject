// auth.js - Simple Supabase initialization
const SUPABASE_URL = window.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

let supabase = null;

function initSupabase() {
    if (typeof supabase !== 'undefined' && supabase && supabase.from) {
        return supabase;
    }
    
    // Load from CDN if not already loaded
    if (typeof window.createClient === 'undefined') {
        console.error('Supabase library not loaded');
        return null;
    }
    
    try {
        supabase = window.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabase = supabase;
        console.log('Supabase initialized');
        return supabase;
    } catch (err) {
        console.error('Supabase init failed:', err);
        return null;
    }
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}