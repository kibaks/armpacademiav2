// Keep initialization failures observable without exposing stack traces or secrets.
let application;
export default async function handler(req, res) {
  try {
    application ||= import('../dist/api.mjs').then(module => module.default);
    const app = await application;
    return app(req, res);
  } catch (error) {
    application = undefined;
    console.error('[API startup]', error);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Service temporairement indisponible.', code: error.code || error.name || 'STARTUP_FAILED' }));
  }
}
