// Funzione serverless Vercel: riceve nome, cognome ed email dal modulo,
// li salva sul Google Sheet tramite l'Apps Script e SOLO se il salvataggio
// riesce restituisce al browser il link del bonus.
// Il link del bonus non compare mai nel codice della pagina: vive solo nelle
// variabili d'ambiente di Vercel (BONUS_DRIVE_URL oppure BONUS_URL).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LEN = { nome: 80, cognome: 80, email: 160 };
const UPSTREAM_TIMEOUT_MS = 12000;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch (_) { return null; }
    }
    if (typeof req.body === 'object') return req.body;
  }
  // Corpo non ancora letto (es. ambienti senza body parser)
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function clean(v) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim() : '';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'Metodo non consentito.' });
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  const bonusUrl = process.env.BONUS_DRIVE_URL || process.env.BONUS_URL;
  const libro = process.env.BOOK_TITLE || 'Meno Rumore in Testa con lo Zen';

  if (!scriptUrl || !secret || !bonusUrl) {
    console.error('Configurazione incompleta: mancano', [
      !scriptUrl && 'GOOGLE_SCRIPT_URL', !secret && 'APPS_SCRIPT_SECRET', !bonusUrl && 'BONUS_DRIVE_URL/BONUS_URL'
    ].filter(Boolean).join(', '));
    return send(res, 500, { ok: false, error: 'La pagina non è ancora configurata del tutto. Riprova più tardi.' });
  }

  const body = await readBody(req);
  if (!body || typeof body !== 'object') {
    return send(res, 400, { ok: false, error: 'Richiesta non valida.' });
  }

  // Honeypot: un campo invisibile che solo i bot compilano.
  // Rispondiamo con un errore generico, senza salvare e senza link.
  if (clean(body.website)) {
    return send(res, 400, { ok: false, error: 'Richiesta non valida.' });
  }

  const nome = clean(body.nome);
  const cognome = clean(body.cognome);
  const email = clean(body.email).toLowerCase();

  if (!nome || !cognome || !email) {
    return send(res, 400, { ok: false, error: 'Compila nome, cognome ed email per continuare.' });
  }
  if (nome.length > MAX_LEN.nome || cognome.length > MAX_LEN.cognome || email.length > MAX_LEN.email) {
    return send(res, 400, { ok: false, error: 'Uno dei campi è troppo lungo.' });
  }
  if (!EMAIL_RE.test(email)) {
    return send(res, 400, { ok: false, error: "Controlla l'indirizzo email: sembra incompleto." });
  }

  const payload = { secret, nome, cognome, email, libro, timestamp: new Date().toISOString() };

  let upstream;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const r = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: ctrl.signal
    });
    const text = await r.text();
    try { upstream = JSON.parse(text); } catch (_) { upstream = null; }
    if (!r.ok || !upstream) {
      console.error('Apps Script ha risposto in modo inatteso:', r.status, text.slice(0, 200));
    }
  } catch (e) {
    console.error('Apps Script non raggiungibile:', e && e.name, e && e.message);
    upstream = null;
  } finally {
    clearTimeout(timer);
  }

  if (!upstream || upstream.ok !== true) {
    if (upstream && upstream.error) console.error('Apps Script ha rifiutato il salvataggio:', upstream.error);
    return send(res, 502, { ok: false, error: "Non è stato possibile registrare i tuoi dati. Riprova tra qualche istante." });
  }

  return send(res, 200, { ok: true, bonusUrl });
};
