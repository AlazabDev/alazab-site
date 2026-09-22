// Shared admin authentication middleware.
// Contract matches routes/admin.js and routes/dynamic-routes.js:
// callers must supply ADMIN_API_KEY via the x-admin-key header or a Bearer token.
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return res.status(503).json({ error: 'Admin API not configured. Set ADMIN_API_KEY in .env' });
  }
  const provided =
    req.headers['x-admin-key'] ||
    (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!provided || provided !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = requireAdminKey;
module.exports.requireAdminKey = requireAdminKey;
