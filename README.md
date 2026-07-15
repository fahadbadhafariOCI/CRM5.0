# Synapse CRM

Internal account / stakeholder / partner tracker for IFM. A single Node service
serves a Preact single-page frontend and a REST + WebSocket API backed by Postgres.

- **Backend** — Express, Postgres (`pg`), JWT cookie auth, WebSocket live sync.
- **Frontend** — `public/` (Preact + htm via CDN, no build step). Served by the same service.
- **Deploy target** — Railway (single service + managed Postgres).

## Architecture

```
crm-app/
├─ server/
│  ├─ index.js   Express app, REST API, WebSocket, static + SPA fallback
│  ├─ db.js      Postgres pool + schema (CREATE TABLE IF NOT EXISTS on boot)
│  ├─ seed.js    First-run seed (the 21 prototype accounts, stakeholders, partners)
│  └─ auth.js    register / login / logout / me  (bcrypt + JWT httpOnly cookie)
├─ public/
│  ├─ index.html
│  └─ app.js     The whole frontend
├─ package.json
├─ railway.json  Railway build/deploy config
└─ .env.example
```

Mutations go over HTTP; every successful create/update/delete is broadcast over
the WebSocket to all connected clients so edits sync live. Each client tags its
requests with an `X-Client-Id` so it ignores the echo of its own changes.

## API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{email, password, name}` → sets cookie |
| POST | `/api/auth/login` | `{email, password}` → sets cookie |
| POST | `/api/auth/logout` | clears cookie |
| GET | `/api/auth/me` | current user (401 if not signed in) |
| GET | `/api/bootstrap` | `{accounts, contacts, partners}` |
| POST/PATCH/DELETE | `/api/accounts[/:id]` | |
| POST/PATCH/DELETE | `/api/contacts[/:id]` | |
| POST/PATCH/DELETE | `/api/partners[/:id]` | |
| GET | `/api/health` | healthcheck |
| WS | `/ws` | live sync (requires auth cookie) |

All `/api` routes except `auth/*` and `health` require the auth cookie.

## Run locally

1. Have Postgres running and create a database, e.g. `createdb synapse_crm`.
2. Copy env and fill it in:
   ```bash
   cp .env.example .env
   # set DATABASE_URL and JWT_SECRET
   ```
   Generate a secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. Install and start:
   ```bash
   npm install
   npm run dev    # or: npm start
   ```
4. Open http://localhost:3000, click **Register** to create the first account.

Tables are created automatically on boot, and the database is seeded with the
prototype data the first time it starts empty.

## Deploy to Railway

1. Push this folder to a GitHub repo (repo root = this folder, so `package.json`
   sits at the top).
2. In Railway: **New Project → Deploy from GitHub repo** and pick it.
3. Add a database: **New → Database → PostgreSQL**.
4. On the app service, open **Variables** and set:
   - `DATABASE_URL` → reference the Postgres var: `${{ Postgres.DATABASE_URL }}`
   - `JWT_SECRET` → a long random string
   - `NODE_ENV` → `production`  (makes the auth cookie `Secure`)
   - *(optional)* `ALLOWED_EMAILS` → comma-separated allowlist for registration
5. Railway sets `PORT` automatically and runs `npm start` (see `railway.json`).
   Nixpacks detects Node from `package.json`.
6. Open the generated URL and register the first user.

> Railway's internal Postgres connection does **not** need SSL, so leave
> `DATABASE_SSL` unset/`false`. Only set it to `true` if you connect to an
> external Postgres that requires SSL.

## Locking down registration

By default anyone with the URL can register. To restrict it, set `ALLOWED_EMAILS`
to a comma-separated list (e.g. `alice@ifm.gov,bob@ifm.gov`); only those emails
may create accounts. Existing users can always sign in.

## Notes

- The frontend loads Preact + htm from `esm.sh` at runtime. It needs outbound
  network access from the browser. If you want a fully self-hosted bundle with no
  CDN dependency, vendor those two modules into `public/` and update the imports
  in `app.js`.
- Seed data reflects the prototype's accounts, with each account's pipeline stage
  and next step pre-filled. Edit or delete freely once running.
