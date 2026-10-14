// Restituisce solo informazioni pubbliche per la nota sulla privacy.
// Non contiene mai il link del bonus.
module.exports = function handler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(JSON.stringify({ privacyEmail: process.env.PRIVACY_EMAIL || '' }));
};
