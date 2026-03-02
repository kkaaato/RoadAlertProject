module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pinData = req.body;

    // Validate required fields
    if (!pinData.type || !pinData.lat || !pinData.lng || !pinData.created_by) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, lat, lng, created_by' 
      });
    }

    // Get Supabase credentials from environment
    const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      console.error('Missing env vars:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceRole: !!serviceRole 
      });
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('Creating pin for user:', pinData.created_by);

    // Insert pin using service role (bypasses RLS)
    const response = await fetch(`${supabaseUrl}/rest/v1/pins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRole}`,
        'apikey': serviceRole,
        'Prefer': 'return=representation'  // Return the inserted data
      },
      body: JSON.stringify({
        type: pinData.type,
        description: pinData.description,
        lat: pinData.lat,
        lng: pinData.lng,
        created_by: pinData.created_by,
        created_by_name: pinData.created_by_name,
        created_at: pinData.created_at || new Date().toISOString(),
        expires_at: pinData.expires_at,
        duration: pinData.duration,
        upvotes: pinData.upvotes || 0,
        downvotes: pinData.downvotes || 0,
        voters: pinData.voters || {},
        status: pinData.status || 'active'
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Supabase error:', response.status, responseText);
      return res.status(response.status).json({ 
        error: 'Database error', 
        details: responseText 
      });
    }

    // Parse the returned data
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = null;
    }

    console.log('Pin created successfully:', data);

    res.status(200).json({ 
      success: true, 
      data: data 
    });

  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: err.message 
    });
  }
};