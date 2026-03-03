async function checkAuth() {
    console.log('Checking auth...');
    
    if (demoMode) {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }
        currentUser = JSON.parse(userData);
        document.getElementById('userDisplay').textContent = currentUser.displayName || currentUser.email;
        console.log('Demo mode user:', currentUser);
        return;
    }
    
    // Wait for supabaseClient to be ready  ← CHANGED from window.supabase
    let attempts = 0;
    while (!supabaseClient && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    
    if (!supabaseClient) {  // ← CHANGED from window.supabase
        console.error('Supabase not available after waiting');
        document.getElementById('userDisplay').textContent = 'Error';
        return;
    }
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();  // ← CHANGED
        
        if (error) {
            console.error('Session error:', error);
            window.location.href = 'index.html';
            return;
        }
        
        if (!session || !session.user) {
            console.log('No session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = {
            uid: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.username || session.user.email
        };
        
        document.getElementById('userDisplay').textContent = currentUser.displayName;
        console.log('Auth success:', currentUser);
        
    } catch (err) {
        console.error('checkAuth error:', err);
        document.getElementById('userDisplay').textContent = 'Error';
    }
}