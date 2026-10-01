// Same-origin Vercel API. No app.listen(), local Ollama, or background timers.
const app = require('../server/dist/app').default;
const { connectDatabase } = require('../server/dist/config/db');
module.exports = async function handler(req, res) {
  const incoming = new URL(req.url, 'http://localhost');
  const route = req.query?.__route ?? incoming.searchParams.get('__route');
  if (typeof route === 'string') {
    incoming.searchParams.delete('__route');
    if (req.query) delete req.query.__route;
    req.url = `/api/${route.replace(/^\/+/, '')}${incoming.search}`;
    req.originalUrl = req.url;
  }
  try { await connectDatabase(); }
  catch { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: false, message: 'The service is temporarily unavailable.' })); return; }
  return app(req, res);
};
