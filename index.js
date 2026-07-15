'use strict';

require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const { WebSocketServer } = require('ws');

const db = require('./db');
const { seedIfEmpty } = require('./seed');
const auth = require('./auth');
const { requireAuth, verifyToken, TOKEN_COOKIE } = auth;

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ---- Row <-> API mappers (snake_case DB <-> camelCase client) ----
const mapAccount = (r) => ({
  id: r.id, name: r.name, sector: r.sector, product: r.product, priority: r.priority,
  useCase: r.use_case, why: r.why, stage: r.stage, nextSteps: r.next_steps, contactName: r.contact_name,
  logoUrl: r.logo_url,
  website: r.website, phone: r.phone, hq: r.hq, employees: r.employees, orgSize: r.org_size, description: r.description,
});
const mapContact = (r) => ({
  id: r.id, firstName: r.first_name, lastName: r.last_name, role: r.role, companyId: r.account_id,
});
const mapPartner = (r) => ({ id: r.id, name: r.name, offering: r.offering, logoUrl: r.logo_url });

// ---- WebSocket live sync ----
const broadcast = (() => {
  let wss = null;
  return {
    attach(server) {
      wss = new WebSocketServer({ noServer: true });
      wss.on('connection', (ws) => {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
        ws.on('message', () => {}); // clients are receive-only
      });
      // Authenticate the upgrade ourselves, then hand off to ws.
      server.on('upgrade', (req, socket, head) => {
        if (!req.url || !req.url.startsWith('/ws')) return;
        const header = req.headers.cookie || '';
        const parsed = cookie.parse(header);
        if (!verifyToken(parsed[TOKEN_COOKIE])) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
      });
      // Drop dead connections every 30s.
      setInterval(() => {
        if (!wss) return;
        wss.clients.forEach((ws) => {
          if (ws.isAlive === false) return ws.terminate();
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000);
    },
    send(msg) {
      if (!wss) return;
      const data = JSON.stringify(msg);
      wss.clients.forEach((ws) => { if (ws.readyState === 1) ws.send(data); });
    },
  };
})();

// ---- Health ----
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---- Auth routes ----
auth.registerRoutes(app);

// ---- Bootstrap: everything in one call ----
app.get('/api/bootstrap', requireAuth, async (req, res) => {
  try {
    const [a, c, p] = await Promise.all([
      db.query('SELECT * FROM accounts ORDER BY id'),
      db.query('SELECT * FROM contacts ORDER BY id'),
      db.query('SELECT * FROM partners ORDER BY id'),
    ]);
    res.json({
      accounts: a.rows.map(mapAccount),
      contacts: c.rows.map(mapContact),
      partners: p.rows.map(mapPartner),
    });
  } catch (e) {
    console.error('bootstrap error', e);
    res.status(500).json({ error: 'Could not load data.' });
  }
});

// ---- Helpers ----
// Echo the originating client id on broadcasts so a client can ignore its own
// events (prevents clobbering in-progress edits).
const emit = (req, msg) => broadcast.send({ ...msg, origin: req.get('X-Client-Id') || null });

function pick(body, fields) {
  const out = {};
  for (const f of fields) if (body[f] !== undefined) out[f] = body[f];
  return out;
}

// camelCase API field -> DB column for accounts
const ACCOUNT_COLS = {
  name: 'name', sector: 'sector', product: 'product', priority: 'priority',
  useCase: 'use_case', why: 'why', stage: 'stage', nextSteps: 'next_steps', contactName: 'contact_name',
  logoUrl: 'logo_url',
  website: 'website', phone: 'phone', hq: 'hq', employees: 'employees', orgSize: 'org_size', description: 'description',
};
const CONTACT_COLS = { firstName: 'first_name', lastName: 'last_name', role: 'role', companyId: 'account_id' };
const PARTNER_COLS = { name: 'name', offering: 'offering', logoUrl: 'logo_url' };

function buildUpdate(table, cols, body, id) {
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [apiKey, col] of Object.entries(cols)) {
    if (body[apiKey] !== undefined) {
      sets.push(`${col} = $${i++}`);
      let v = body[apiKey];
      if (col === 'account_id') v = v === '' || v == null ? null : Number(v);
      vals.push(v);
    }
  }
  if (!sets.length) return null;
  vals.push(id);
  return { text: `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals };
}

// ============ ACCOUNTS ============
app.post('/api/accounts', requireAuth, async (req, res) => {
  try {
    const b = req.body || {};
    if (!String(b.name || '').trim()) return res.status(400).json({ error: 'Account name is required.' });
    const { rows } = await db.query(
      `INSERT INTO accounts (name, sector, product, priority, use_case, why, stage, next_steps, contact_name, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [b.name, b.sector || '', b.product || 'Jais', b.priority || 'Medium', b.useCase || '',
       b.why || '', b.stage || 'Not Started', b.nextSteps || '', b.contactName || '', b.logoUrl || '']
    );
    const data = mapAccount(rows[0]);
    emit(req, { entity: 'account', action: 'create', data });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not create account.' }); }
});

app.patch('/api/accounts/:id', requireAuth, async (req, res) => {
  try {
    const q = buildUpdate('accounts', ACCOUNT_COLS, req.body || {}, Number(req.params.id));
    if (!q) return res.status(400).json({ error: 'Nothing to update.' });
    const { rows } = await db.query(q.text, q.vals);
    if (!rows.length) return res.status(404).json({ error: 'Account not found.' });
    const data = mapAccount(rows[0]);
    emit(req, { entity: 'account', action: 'update', data });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not update account.' }); }
});

app.delete('/api/accounts/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.query('DELETE FROM accounts WHERE id = $1', [id]);
    // contacts.account_id is set NULL by FK; tell clients to reconcile.
    emit(req, { entity: 'account', action: 'delete', id });
    emit(req, { entity: 'contacts', action: 'orphan', accountId: id });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not delete account.' }); }
});

// ============ CONTACTS ============
app.post('/api/contacts', requireAuth, async (req, res) => {
  try {
    const b = req.body || {};
    if (!String(b.firstName || '').trim()) return res.status(400).json({ error: 'A first name is required.' });
    const accountId = b.companyId === '' || b.companyId == null ? null : Number(b.companyId);
    const { rows } = await db.query(
      `INSERT INTO contacts (first_name, last_name, role, account_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [b.firstName, b.lastName || '', b.role || '', accountId]
    );
    const data = mapContact(rows[0]);
    emit(req, { entity: 'contact', action: 'create', data });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not create stakeholder.' }); }
});

app.patch('/api/contacts/:id', requireAuth, async (req, res) => {
  try {
    const q = buildUpdate('contacts', CONTACT_COLS, req.body || {}, Number(req.params.id));
    if (!q) return res.status(400).json({ error: 'Nothing to update.' });
    const { rows } = await db.query(q.text, q.vals);
    if (!rows.length) return res.status(404).json({ error: 'Stakeholder not found.' });
    const data = mapContact(rows[0]);
    emit(req, { entity: 'contact', action: 'update', data });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not update stakeholder.' }); }
});

app.delete('/api/contacts/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.query('DELETE FROM contacts WHERE id = $1', [id]);
    emit(req, { entity: 'contact', action: 'delete', id });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not delete stakeholder.' }); }
});

// ============ PARTNERS ============
app.post('/api/partners', requireAuth, async (req, res) => {
  try {
    const b = req.body || {};
    if (!String(b.name || '').trim()) return res.status(400).json({ error: 'Partner name is required.' });
    const { rows } = await db.query(
      `INSERT INTO partners (name, offering, logo_url) VALUES ($1,$2,$3) RETURNING *`,
      [b.name, b.offering || '', b.logoUrl || '']
    );
    const data = mapPartner(rows[0]);
    emit(req, { entity: 'partner', action: 'create', data });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not create partner.' }); }
});

app.patch('/api/partners/:id', requireAuth, async (req, res) => {
  try {
    const q = buildUpdate('partners', PARTNER_COLS, req.body || {}, Number(req.params.id));
    if (!q) return res.status(400).json({ error: 'Nothing to update.' });
    const { rows } = await db.query(q.text, q.vals);
    if (!rows.length) return res.status(404).json({ error: 'Partner not found.' });
    const data = mapPartner(rows[0]);
    emit(req, { entity: 'partner', action: 'update', data });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not update partner.' }); }
});

app.delete('/api/partners/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.query('DELETE FROM partners WHERE id = $1', [id]);
    emit(req, { entity: 'partner', action: 'delete', id });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not delete partner.' }); }
});

// ---- Static frontend + SPA fallback ----
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ---- Boot ----
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
broadcast.attach(server);

(async () => {
  try {
    await db.init();
    await seedIfEmpty();
    server.listen(PORT, () => console.log(`Synapse CRM listening on :${PORT}`));
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
})();
