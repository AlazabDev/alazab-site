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

const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

// Cache the reCAPTCHA client
const recaptchaClient = new RecaptchaEnterpriseServiceClient();

/**
  * Create an assessment to analyze the risk of a UI action.
  */
async function createAssessment({
  projectID = "alazab-services",
  recaptchaKey = "6LdD5IMtAAAAANJJJwrHNUzHZbfz0f5bUo2alPKT",
  token = "action-token",
  recaptchaAction = "LOGIN",
}) {
  const projectPath = recaptchaClient.projectPath(projectID);

  const request = ({
    assessment: {
      event: {
        token: token,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  });

  const [ response ] = await recaptchaClient.createAssessment(request);

  if (!response.tokenProperties.valid) {
    console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
    return null;
  }

  if (response.tokenProperties.action === recaptchaAction) {
    console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
    return response.riskAnalysis.score;
  } else {
    console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
    return null;
  }
}

// POST /auth/v1/verify-recaptcha — Verify reCAPTCHA token
router.post('/verify-recaptcha', express.json(), async (req, res) => {
  try {
    const { token, action } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const score = await createAssessment({
      token: token,
      recaptchaAction: action || 'LOGIN'
    });

    if (score !== null) {
      // You can define a threshold for the score to decide whether to block the request
      return res.json({ success: true, score: score });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid reCAPTCHA token or action mismatch' });
    }
  } catch (err) {
    console.error('reCAPTCHA verification error:', err);
    res.status(500).json({ error: 'reCAPTCHA verification failed' });
  }
});

module.exports = router;
