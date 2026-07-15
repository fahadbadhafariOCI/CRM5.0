'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const TOKEN_COOKIE = 'synapse_token';
const TOKEN_TTL = '30d';
const IS_PROD = process.env.NODE_ENV === 'production';

function allowedEmails() {
  return (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function signToken(user) {
  return jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Express middleware — requires a valid session cookie.
async function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[TOKEN_COOKIE];
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Not authenticated' });
  req.user = { id: payload.uid, email: payload.email };
  next();
}

function publicUser(row) {
  return { id: row.id, email: row.email, name: row.name };
}

function registerRoutes(app) {
  app.post('/api/auth/register', async (req, res) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const name = String(req.body.name || '').trim();
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

      const allow = allowedEmails();
      if (allow.length && !allow.includes(email)) {
        return res.status(403).json({ error: 'This email is not permitted to register.' });
      }

      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length) return res.status(409).json({ error: 'An account with that email already exists.' });

      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1,$2,$3) RETURNING id, email, name',
        [email, name, hash]
      );
      const user = rows[0];
      setAuthCookie(res, signToken(user));
      res.json({ user: publicUser(user) });
    } catch (e) {
      console.error('register error', e);
      res.status(500).json({ error: 'Could not create account.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });
      setAuthCookie(res, signToken(user));
      res.json({ user: publicUser(user) });
    } catch (e) {
      console.error('login error', e);
      res.status(500).json({ error: 'Could not sign in.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ user: publicUser(rows[0]) });
  });
}

module.exports = { registerRoutes, requireAuth, verifyToken, TOKEN_COOKIE };
