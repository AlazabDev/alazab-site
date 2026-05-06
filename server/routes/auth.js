const express = require('express');
const router = express.Router();

// GET /auth/v1/callback — OAuth callback handler (Google, Facebook)
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    const rawQuery = req.originalUrl.includes('?')
      ? req.originalUrl.split('?').slice(1).join('?')
      : '';

    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(
        `${process.env.FRONTEND_URL || 'https://alazab.com'}/auth?mode=login&error=${encodeURIComponent(String(error))}&error_description=${encodeURIComponent(String(error_description || error))}`
      );
    }

    if (!code) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'https://alazab.com'}/auth?mode=login&error=no_code`
      );
    }

    // Parse state to determine provider
    let provider = 'unknown';
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      provider = stateData.provider || 'unknown';
    } catch {
      /* state may not be JSON */
    }

    console.log(`✅ OAuth callback received: provider=${provider}`);

    // Forward to Supabase auth callback if using Supabase Auth
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl) {
      return res.redirect(`${supabaseUrl}/auth/v1/callback${rawQuery ? `?${rawQuery}` : ''}`);
    }

    // Redirect to frontend with auth code
    res.redirect(
      `${process.env.FRONTEND_URL || 'https://alazab.com'}/auth?mode=login&code=${encodeURIComponent(String(code))}&provider=${encodeURIComponent(provider)}`
    );
  } catch (err) {
    console.error('Auth callback error:', err);
    res.redirect(
      `${process.env.FRONTEND_URL || 'https://alazab.com'}/auth?mode=login&error=server_error&error_description=${encodeURIComponent(err.message || 'Unexpected OAuth callback error')}`
    );
  }
});

// POST /auth/v1/callback — Token exchange
router.post('/callback', express.json(), async (req, res) => {
  try {
    const { code, provider } = req.body;
    if (!code || !provider) {
      return res.status(400).json({ error: 'Missing code or provider' });
    }

    // Forward to Supabase or handle token exchange
    res.json({ success: true, message: 'Token exchange endpoint ready' });
  } catch (err) {
    console.error('Token exchange error:', err);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// GET /auth/v1/status — Check auth service status
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    providers: ['google', 'facebook', 'email'],
    supabase_connected: !!process.env.SUPABASE_URL,
  });
});

module.exports = router;
