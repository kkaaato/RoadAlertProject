module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || null;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || null;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

  const result = {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnon,
    supabaseServiceRoleKey: !!serviceRole,
    profilesTest: null
  };

  if (supabaseUrl && serviceRole) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?select=id&limit=1`;
      const r = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRole}`,
          'apikey': serviceRole,
          'Accept': 'application/json'
        }
      });
      result.profilesTest = { status: r.status };
      if (!r.ok) {
        const text = await r.text();
        result.profilesTest.error = text;
      }
    } catch (e) {
      result.profilesTest = { error: e.message };
    }
  } else {
    result.profilesTest = { skipped: true };
  }

  res.status(200).json(result);
};
