// auth.js - Supabase initialization with retry logic

(function() {
    // Prevent double initialization
    if (window.authJsInitialized) {
        console.log('auth.js already initialized, skipping');
        return;
    }
    window.authJsInitialized = true;

    let initAttempts = 0;
    const maxAttempts = 10;

    function tryInitSupabase() {
        initAttempts++;
        
        // Check if Supabase library is loaded
        if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
            if (initAttempts < maxAttempts) {
                console.log(`Waiting for Supabase library... attempt ${initAttempts}`);
                setTimeout(tryInitSupabase, 200);
                return;
            }
            console.error('Supabase library failed to load');
            return;
        }

        // Check if env vars are loaded
        const url = window.SUPABASE_URL;
        const key = window.SUPABASE_ANON_KEY;

        if (!url || !key) {
            if (initAttempts < maxAttempts) {
                console.log(`Waiting for env vars... attempt ${initAttempts}`);
                setTimeout(tryInitSupabase, 200);
                return;
            }
            console.error('Supabase env vars not found after retries');
            // Use fallback for testing (replace with your actual values)
            console.warn('Add fallback values or check /api/env endpoint');
            return;
        }

        // Initialize client
        try {
            const client = window.supabase.createClient(url, key);
            window.supabaseClient = client;
            window.supabase = client; // For backward compatibility
            console.log('Supabase initialized successfully');
        } catch (err) {
            console.error('Failed to create Supabase client:', err);
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInitSupabase);
    } else {
        tryInitSupabase();
    }
})();