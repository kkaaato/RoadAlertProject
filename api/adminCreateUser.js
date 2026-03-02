module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return res.status(500).json({ error: 'Missing configuration on server' });
  }

  try {
    // 1) Create user via Supabase Admin API
    const adminEndpoint = `${supabaseUrl}/auth/v1/admin/users`;
    const createUserRes = await fetch(adminEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRole}`,
        'apikey': serviceRole
      },
      body: JSON.stringify({
        email,
        password,
        user_metadata: { username }
      })
    });

    const createText = await createUserRes.text();
    let createBody = null;
    try { createBody = JSON.parse(createText); } catch(e) { createBody = createText; }

    if (!createUserRes.ok) {
      console.error('adminCreateUser: create user failed', createUserRes.status, createBody);
      return res.status(createUserRes.status).json({ error: createBody });
    }

    const userId = createBody && createBody.id ? createBody.id : null;
    if (!userId) {
      console.error('adminCreateUser: no user id returned', createBody);
      return res.status(500).json({ error: 'No user id returned from Supabase admin' });
    }

    // 2) Insert profile row using service role (bypass RLS)
    const profilesEndpoint = `${supabaseUrl}/rest/v1/profiles`;
    const insertRes = await fetch(profilesEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRole}`,
        'apikey': serviceRole,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ id: userId, username, email, created_at: new Date().toISOString() })
    });

    if (!insertRes.ok) {
      const txt = await insertRes.text();
      console.error('adminCreateUser: profile insert failed', insertRes.status, txt);
      return res.status(insertRes.status).json({ error: txt, createUser: createBody });
    }

    const insertText = await insertRes.text().catch(() => null);
    // Success - return debug info (non-secret)
    res.status(200).json({ success: true, userId, createdUser: createBody, profileInsert: insertText || null });
  } catch (err) {
    console.error('adminCreateUser error', err);
    res.status(500).json({ error: err.message });
  }
};
