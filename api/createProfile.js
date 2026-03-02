module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { userId, username, email } = req.body;

  if (!userId || !username || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const url = `${supabaseUrl}/rest/v1/profiles`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({ error: 'Missing config' });
  }

  try {
    // quick runtime check (do not log the actual key)
    console.log('createProfile: supabaseUrl set?', !!supabaseUrl, 'serviceRole set?', !!key);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'apikey': key,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ id: userId, username, email })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Supabase error:', response.status, text);
      return res.status(response.status).json({ error: text || 'Failed' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
};

