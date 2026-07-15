import { h, render } from 'https://esm.sh/preact@10.22.1';
import { useState, useEffect, useRef } from 'https://esm.sh/preact@10.22.1/hooks';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(h);

/* ----------------------------- API client ----------------------------- */
const CLIENT_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);

async function req(method, path, body) {
  const opts = { method, credentials: 'include', headers: { 'X-Client-Id': CLIENT_ID } };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch('/api' + path, opts);
  let data = null;
  try { data = await r.json(); } catch (_) {}
  if (!r.ok) {
    const err = new Error((data && data.error) || ('Request failed (' + r.status + ')'));
    err.status = r.status;
    throw err;
  }
  return data;
}
const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  patch: (p, b) => req('PATCH', p, b),
  del: (p) => req('DELETE', p),
};

/* ----------------------------- Style helpers ----------------------------- */
const BRAND = { c600: '#2541f5', c700: '#1d31db', c500: '#3b62ff', c50: '#eef4ff' };

function pill(bg, fg, bd) {
  return { display: 'inline-flex', alignItems: 'center', borderRadius: '999px', padding: '2px 9px', fontSize: '12px', fontWeight: 500, background: bg, color: fg, border: '1px solid ' + bd, whiteSpace: 'nowrap' };
}
function priorityStyle(p) {
  if (p === 'High') return pill('#fff1f2', '#be123c', '#fecdd3');
  if (p === 'Medium') return pill('#fffbeb', '#b45309', '#fde68a');
  return pill('#f1f5f9', '#334155', '#e2e8f0');
}
function stageSelectStyle(stage) {
  const m = {
    'Not Started': ['#f1f5f9', '#334155'],
    'Identified': ['#f0f9ff', '#0369a1'],
    'Engaged': ['#eef2ff', '#4338ca'],
    'POC': ['#f5f3ff', '#6d28d9'],
    'Proposal': ['#fffbeb', '#b45309'],
    'Negotiation': ['#fff7ed', '#c2410c'],
    'Won': ['#ecfdf5', '#047857'],
    'On Hold': ['#fff1f2', '#be123c'],
  };
  const c = m[stage] || m['Identified'];
  return { width: '100%', border: 'none', background: c[0], color: c[1], fontSize: '13px', fontWeight: 500, padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', outline: 'none' };
}
function navStyle(active) {
  return { display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', background: active ? BRAND.c50 : 'transparent', color: active ? BRAND.c700 : '#475569', transition: 'background .15s' };
}
const card = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15,23,42,.04)' };
const th = { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: '#64748b' };
const fieldStyle = { width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '14px', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#475569', marginBottom: '5px' };
const STAGE_OPTIONS = ['Not Started', 'Identified', 'Engaged', 'POC', 'Proposal', 'Negotiation', 'Won', 'On Hold'];

const icons = {
  dashboard: 'M3 12 12 4l9 8M5 10v10h14V10',
  accounts: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
  contacts: 'M16 14a4 4 0 1 0-8 0M4 20a8 8 0 1 1 16 0',
  analytics: 'M3 3v18h18M7 14l4-4 4 4 5-5',
  holistic: 'M4 4h16v16H4zM4 10h16M4 15h16M10 10v10',
};
const Icon = (d, size = 20) => html`<svg style=${{ height: size + 'px', width: size + 'px', flex: 'none' }} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d=${d}></path></svg>`;

/* ----------------------------- Logos ----------------------------- */
// Official website domains, keyed by account / partner name. Logos are pulled
// live from these via a favicon service — no image files stored. Unknown names
// (e.g. newly-added accounts) fall back to a colored monogram automatically.
const DOMAINS = {
  'Abu Dhabi Executive Council': 'ec.gov.ae',
  'Department of Government Enablement': 'dge.gov.ae',
  'Abu Dhabi Digital Authority (TAMM)': 'adda.gov.ae',
  'Abu Dhabi Human Resources Authority': 'hra.gov.ae',
  'Statistics Centre': 'scad.gov.ae',
  'Abu Dhabi Competitiveness Office': 'added.gov.ae',
  'General Secretariat of the Executive Council': 'ec.gov.ae',
  'Department of Health': 'doh.gov.ae',
  'SEHA': 'seha.ae',
  'Department of Municipalities and Transport': 'dmt.gov.ae',
  'Abu Dhabi Projects & Infrastructure Centre': 'adpic.gov.ae',
  'Abu Dhabi Airports': 'abudhabiairport.ae',
  'Abu Dhabi Ports': 'adportsgroup.com',
  'Abu Dhabi Housing Authority': 'adha.gov.ae',
  'Department of Energy': 'doe.gov.ae',
  'TAQA': 'taqaglobal.com',
  'Environment Agency': 'ead.gov.ae',
  'Department of Finance': 'dof.gov.ae',
  'Abu Dhabi Global Market': 'adgm.com',
  'Department of Culture and Tourism': 'dctabudhabi.ae',
  'Abu Dhabi National Exhibition Centre': 'adnec.ae',
  'ADQ': 'adq.ae',
  'Microsoft': 'microsoft.com',
  'Amazon Web Services': 'aws.amazon.com',
  'G42': 'g42.ai',
  'UnifyApps': 'unifyapps.com',
  'Dataiku': 'dataiku.com',
  'Oracle': 'oracle.com',
  'NVIDIA': 'nvidia.com',
  'Core42': 'core42.ai',
  'Presight': 'presight.ai',
  'UiPath': 'uipath.com',
};
// Bundled logo files (served from /logos) for accounts whose favicon is poor
// or missing. Takes priority over the auto-fetched favicon, below an upload.
const LOCAL_LOGOS = {
  'Core42': 'logos/core42.png',
  'TAQA': 'logos/taqa.png',
  'Department of Culture and Tourism': 'logos/dct.png',
  'Department of Energy': 'logos/doe.png',
  'Department of Municipalities and Transport': 'logos/dmt.png',
};
function initials(name) { return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); }
// Downscale an uploaded image to a small square PNG data URL for storage.
function fileToLogoDataUrl(file, max = 128) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image.'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
// Try multiple logo sources per domain; advance to the next on error, then
// fall back to a monogram. Google's cache misses some sites that DuckDuckGo
// (which fetches the site's own favicon directly) still resolves.
function logoCandidates(domain) {
  return [
    'https://www.google.com/s2/favicons?domain=' + domain + '&sz=128',
    'https://icons.duckduckgo.com/ip3/' + domain + '.ico',
    'https://logo.clearbit.com/' + domain,
  ];
}
function Logo({ name, logoUrl, size = 30, radius = 7 }) {
  const [idx, setIdx] = useState(0);
  // Priority: manual upload > bundled local logo > auto-fetched favicon > monogram.
  const src0 = logoUrl || LOCAL_LOGOS[name] || '';
  if (src0) {
    return html`<span style=${{ height: size + 'px', width: size + 'px', flex: 'none', borderRadius: radius + 'px', overflow: 'hidden', background: '#fff', border: '1px solid #e8edf3', display: 'grid', placeItems: 'center' }}>
      <img src=${src0} style=${{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </span>`;
  }
  const domain = DOMAINS[name] || '';
  const cands = domain ? logoCandidates(domain) : [];
  const src = cands[idx];
  return html`<span style=${{ position: 'relative', height: size + 'px', width: size + 'px', flex: 'none', borderRadius: radius + 'px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e8edf3', display: 'grid', placeItems: 'center' }}>
    <span style=${{ fontSize: Math.round(size * 0.37) + 'px', fontWeight: 600, color: '#64748b' }}>${initials(name)}</span>
    ${src && html`<img src=${src} onError=${() => setIdx((i) => i + 1)} style=${{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />`}
  </span>`;
}

/* ----------------------------- Login view ----------------------------- */
function LoginView({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { email, password, name };
      const r = await api.post(path, body);
      onAuthed(r.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return html`
    <div style=${{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div style=${{ width: '380px', maxWidth: '100%' }}>
        <div style=${{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '22px' }}>
          <div style=${{ height: '40px', width: '40px', borderRadius: '11px', background: BRAND.c600, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '15px' }}>IFM</div>
          <div>
            <div style=${{ fontSize: '15px', fontWeight: 600 }}>Internal CRM Tool</div>
            <div style=${{ fontSize: '12px', color: '#64748b' }}>IFM Account List</div>
          </div>
        </div>
        <form onSubmit=${submit} style=${{ ...card, padding: '26px' }}>
          <h1 style=${{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px' }}>${mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p style=${{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>${mode === 'login' ? 'Welcome back.' : 'Set up your access to the CRM.'}</p>

          ${mode === 'register' && html`
            <div style=${{ marginBottom: '14px' }}>
              <label style=${labelStyle}>Name</label>
              <input value=${name} onInput=${(e) => setName(e.target.value)} style=${fieldStyle} placeholder="Your name" />
            </div>`}
          <div style=${{ marginBottom: '14px' }}>
            <label style=${labelStyle}>Email</label>
            <input type="email" value=${email} onInput=${(e) => setEmail(e.target.value)} style=${fieldStyle} placeholder="you@ifm.gov" autocomplete="email" />
          </div>
          <div style=${{ marginBottom: '18px' }}>
            <label style=${labelStyle}>Password</label>
            <input type="password" value=${password} onInput=${(e) => setPassword(e.target.value)} style=${fieldStyle} placeholder=${mode === 'register' ? 'At least 8 characters' : '••••••••'} autocomplete=${mode === 'login' ? 'current-password' : 'new-password'} />
          </div>

          ${error && html`<div style=${{ marginBottom: '14px', fontSize: '13px', color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '9px 12px' }}>${error}</div>`}

          <button type="submit" disabled=${busy} style=${{ width: '100%', border: 'none', cursor: busy ? 'default' : 'pointer', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 600, background: BRAND.c600, color: '#fff', opacity: busy ? 0.7 : 1 }}>
            ${busy ? 'Please wait…' : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>

          <div style=${{ marginTop: '16px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
            ${mode === 'login' ? "Don't have an account? " : 'Already have one? '}
            <button type="button" onClick=${() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style=${{ background: 'none', border: 'none', color: BRAND.c600, fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
              ${mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </form>
        <div style=${{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>Confidential — IFM Internal</div>
      </div>
    </div>`;
}

/* ----------------------------- Main app ----------------------------- */
function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState('dashboard');

  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [partners, setPartners] = useState([]);

  const [companySearch, setCompanySearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [holisticSearch, setHolisticSearch] = useState('');
  const [holisticStageFilter, setHolisticStageFilter] = useState('ALL');

  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [dcForm, setDcForm] = useState({ firstName: '', lastName: '', role: '' });
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [live, setLive] = useState(false);

  const showErr = (e) => setToast(typeof e === 'string' ? e : (e && e.message) || 'Something went wrong');

  /* auth check */
  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.user)).catch(() => {}).finally(() => setReady(true));
  }, []);

  /* load data */
  useEffect(() => {
    if (!user) return;
    let alive = true;
    api.get('/bootstrap').then((d) => {
      if (!alive) return;
      setAccounts(d.accounts); setContacts(d.contacts); setPartners(d.partners);
    }).catch((e) => showErr('Could not load data: ' + e.message));
    return () => { alive = false; };
  }, [user]);

  /* websocket live sync */
  useEffect(() => {
    if (!user) return;
    let ws, closed = false, retry;
    const upsert = (list, d) => { const i = list.findIndex((x) => x.id === d.id); if (i === -1) return [...list, d]; const c = list.slice(); c[i] = d; return c; };
    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(proto + '://' + location.host + '/ws');
      ws.onopen = () => setLive(true);
      ws.onclose = () => { setLive(false); if (!closed) retry = setTimeout(connect, 2000); };
      ws.onerror = () => { try { ws.close(); } catch (_) {} };
      ws.onmessage = (evt) => {
        let ev; try { ev = JSON.parse(evt.data); } catch (_) { return; }
        if (ev.origin && ev.origin === CLIENT_ID) return; // ignore our own changes
        if (ev.entity === 'account') {
          if (ev.action === 'delete') setAccounts((l) => l.filter((x) => x.id !== ev.id));
          else setAccounts((l) => upsert(l, ev.data));
        } else if (ev.entity === 'contacts' && ev.action === 'orphan') {
          setContacts((l) => l.map((c) => (c.companyId === ev.accountId ? { ...c, companyId: null } : c)));
        } else if (ev.entity === 'contact') {
          if (ev.action === 'delete') setContacts((l) => l.filter((x) => x.id !== ev.id));
          else setContacts((l) => upsert(l, ev.data));
        } else if (ev.entity === 'partner') {
          if (ev.action === 'delete') setPartners((l) => l.filter((x) => x.id !== ev.id));
          else setPartners((l) => upsert(l, ev.data));
        }
      };
    };
    connect();
    return () => { closed = true; clearTimeout(retry); if (ws) try { ws.close(); } catch (_) {} };
  }, [user]);

  /* toast auto-dismiss */
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);

  if (!ready) {
    return html`<div style=${{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: '14px' }}>Loading…</div>`;
  }
  if (!user) {
    return html`<${LoginView} onAuthed=${(u) => setUser(u)} />`;
  }

  /* ---- derived data ---- */
  const accountById = (id) => accounts.find((c) => c.id === id);
  const peopleCount = (id) => contacts.filter((c) => c.companyId === id).length;
  const highCount = accounts.filter((c) => c.priority === 'High').length;
  const medCount = accounts.filter((c) => c.priority === 'Medium').length;

  /* ---- inline-edit helpers (local-first, save on commit) ---- */
  const localAccount = (id, patch) => setAccounts((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const saveAccount = (id, patch) => api.patch('/accounts/' + id, patch).catch(showErr);
  const editAccount = (id, patch) => { localAccount(id, patch); saveAccount(id, patch); };
  const localContact = (id, patch) => setContacts((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const saveContact = (id, patch) => api.patch('/contacts/' + id, patch).catch(showErr);

  /* ---- deletes ---- */
  const delAccount = (a) => {
    if (!confirm('Delete account "' + a.name + '"? Its stakeholders will be unlinked.')) return;
    setAccounts((l) => l.filter((x) => x.id !== a.id));
    setContacts((l) => l.map((c) => (c.companyId === a.id ? { ...c, companyId: null } : c)));
    api.del('/accounts/' + a.id).catch(showErr);
  };
  const delContact = (c) => {
    if (!confirm('Delete stakeholder "' + (c.firstName + ' ' + c.lastName).trim() + '"?')) return;
    setContacts((l) => l.filter((x) => x.id !== c.id));
    api.del('/contacts/' + c.id).catch(showErr);
  };
  const delPartner = (p) => {
    if (!confirm('Delete partner "' + p.name + '"?')) return;
    setPartners((l) => l.filter((x) => x.id !== p.id));
    api.del('/partners/' + p.id).catch(showErr);
  };

  /* ---- modal open/close ---- */
  const openNewContact = () => { setForm({ firstName: '', lastName: '', role: '', companyId: '' }); setFormError(''); setModal({ type: 'contact', mode: 'create' }); };
  const openEditContact = (c) => { setForm({ firstName: c.firstName, lastName: c.lastName, role: c.role || '', companyId: c.companyId || '' }); setFormError(''); setModal({ type: 'contact', mode: 'edit', id: c.id }); };
  const openNewCompany = () => { setForm({ name: '', sector: '', priority: 'High', useCase: '', why: '', logoUrl: '' }); setFormError(''); setModal({ type: 'company', mode: 'create' }); };
  const openEditCompany = (c) => { setForm({ name: c.name, sector: c.sector, priority: c.priority, useCase: c.useCase || '', why: c.why || '', logoUrl: c.logoUrl || '' }); setFormError(''); setModal({ type: 'company', mode: 'edit', id: c.id }); };
  const openNewPartner = () => { setForm({ name: '', offering: '', logoUrl: '' }); setFormError(''); setModal({ type: 'partner', mode: 'create' }); };
  const openEditPartner = (p) => { setForm({ name: p.name, offering: p.offering || '', logoUrl: p.logoUrl || '' }); setFormError(''); setModal({ type: 'partner', mode: 'edit', id: p.id }); };
  const closeModal = () => { setModal(null); setFormError(''); };
  const onFormInput = (e) => { const { name, value } = e.target; setForm((f) => ({ ...f, [name]: value })); };
  const onLogoFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try { const url = await fileToLogoDataUrl(file); setForm((f) => ({ ...f, logoUrl: url })); }
    catch (err) { setFormError(err.message || 'Could not read that image.'); }
  };

  const saveForm = async () => {
    if (!modal) return;
    try {
      if (modal.type === 'contact') {
        if (!String(form.firstName || '').trim()) { setFormError('A first name is required.'); return; }
        const body = { firstName: form.firstName, lastName: form.lastName, role: form.role, companyId: form.companyId || null };
        if (modal.mode === 'edit') { const d = await api.patch('/contacts/' + modal.id, body); localContact(modal.id, d); }
        else { const d = await api.post('/contacts', body); setContacts((l) => [d, ...l]); }
      } else if (modal.type === 'company') {
        if (!String(form.name || '').trim()) { setFormError('Account name is required.'); return; }
        const body = { name: form.name, sector: form.sector, priority: form.priority, useCase: form.useCase, why: form.why, logoUrl: form.logoUrl || '' };
        if (modal.mode === 'edit') { const d = await api.patch('/accounts/' + modal.id, body); localAccount(modal.id, d); }
        else { const d = await api.post('/accounts', body); setAccounts((l) => [d, ...l]); }
      } else {
        if (!String(form.name || '').trim()) { setFormError('Partner name is required.'); return; }
        const body = { name: form.name, offering: form.offering, logoUrl: form.logoUrl || '' };
        if (modal.mode === 'edit') { const d = await api.patch('/partners/' + modal.id, body); setPartners((l) => l.map((p) => (p.id === modal.id ? d : p))); }
        else { const d = await api.post('/partners', body); setPartners((l) => [...l, d]); }
      }
      closeModal();
    } catch (e) { setFormError(e.message); }
  };

  const logout = async () => { try { await api.post('/auth/logout'); } catch (_) {} setUser(null); setAccounts([]); setContacts([]); setPartners([]); };

  /* ---- filtered collections ---- */
  const coq = companySearch.trim().toLowerCase();
  const filteredCompanies = accounts.filter((c) => !coq || [c.name, c.sector, c.useCase || '', c.why || ''].join(' ').toLowerCase().includes(coq));
  const cq = contactSearch.trim().toLowerCase();
  const filteredContacts = contacts.filter((c) => { const a = accountById(c.companyId); return !cq || [c.firstName, c.lastName, c.role || '', a ? a.name : ''].join(' ').toLowerCase().includes(cq); });
  const hq = holisticSearch.trim().toLowerCase();
  const holisticRows = accounts.filter((c) => {
    if (holisticStageFilter !== 'ALL' && (c.stage || 'Not Started') !== holisticStageFilter) return false;
    return !hq || [c.name, c.nextSteps || '', c.stage || ''].join(' ').toLowerCase().includes(hq);
  });

  /* ---- analytics ---- */
  const secMap = {};
  accounts.forEach((c) => { secMap[c.sector || '—'] = (secMap[c.sector || '—'] || 0) + 1; });
  const secArr = Object.keys(secMap).map((k) => ({ label: k, count: secMap[k] })).sort((a, b) => b.count - a.count).slice(0, 8);
  const maxSec = Math.max(1, ...secArr.map((x) => x.count));
  const covArr = accounts.map((c) => ({ label: c.name, count: peopleCount(c.id) })).filter((x) => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
  const maxCov = Math.max(1, ...covArr.map((x) => x.count));

  /* ---- nav ---- */
  const navItem = (key, label, icon) => html`<button onClick=${() => setRoute(key)} style=${navStyle(route === key)}>${Icon(icon)}${label}</button>`;

  /* ---- sub-views ---- */
  const dashboard = html`
    <div>
      <div style=${{ marginBottom: '24px' }}><h1 style=${{ fontSize: '22px', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1></div>
      <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        ${[['Accounts', accounts.length, 'Government entities mapped'], ['High Priority', highCount, medCount + ' medium priority'], ['Stakeholders', contacts.length, 'Named contacts across accounts'], ['Strategic Partners', partners.length, 'Ecosystem & delivery partners']].map(([t, v, h]) => html`
          <div style=${{ ...card, padding: '20px' }}>
            <div style=${{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>${t}</div>
            <div style=${{ fontSize: '28px', fontWeight: 600, marginTop: '6px', letterSpacing: '-0.02em' }}>${v}</div>
            <div style=${{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>${h}</div>
          </div>`)}
      </div>
      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div style=${{ ...card, overflow: 'hidden' }}>
          <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style=${{ fontSize: '14px', fontWeight: 600, margin: 0 }}>High-Priority Accounts</h2>
            <button onClick=${() => setRoute('companies')} style=${{ fontSize: '12px', fontWeight: 500, color: BRAND.c600, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          <div>${accounts.filter((c) => c.priority === 'High').slice(0, 6).map((a) => html`
            <div style=${{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div style=${{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <${Logo} name=${a.name} logoUrl=${a.logoUrl} />
                <div style=${{ minWidth: 0 }}>
                  <div style=${{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${a.name}</div>
                  <div style=${{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${a.sector}</div>
                </div>
              </div>
              <span style=${priorityStyle(a.priority)}>${a.priority}</span>
            </div>`)}</div>
        </div>
        <div style=${{ ...card, overflow: 'hidden' }}>
          <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style=${{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Strategic Partners</h2>
            <button onClick=${() => setRoute('companies')} style=${{ fontSize: '12px', fontWeight: 500, color: BRAND.c600, background: 'none', border: 'none', cursor: 'pointer' }}>Manage →</button>
          </div>
          <div>${partners.slice(0, 6).map((p) => html`
            <div style=${{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div style=${{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <${Logo} name=${p.name} logoUrl=${p.logoUrl} />
                <div style=${{ fontSize: '14px', fontWeight: 500 }}>${p.name}</div>
              </div>
              <div style=${{ fontSize: '13px', color: '#64748b', textAlign: 'right' }}>${p.offering}</div>
            </div>`)}</div>
        </div>
      </div>
    </div>`;

  const companiesView = html`
    <div>
      <div style=${{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style=${{ fontSize: '22px', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Accounts</h1>
          <p style=${{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>${accounts.length} government entities mapped</p>
        </div>
        <button onClick=${openNewCompany} style=${{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '9px 14px', fontSize: '14px', fontWeight: 500, background: BRAND.c600, color: '#fff' }}>＋ New Account</button>
      </div>
      <div style=${{ ...card, overflow: 'hidden' }}>
        <div style=${{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <input value=${companySearch} onInput=${(e) => setCompanySearch(e.target.value)} placeholder="Search account, sector, use case..." style=${{ flex: 1, minWidth: '220px', maxWidth: '300px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '14px', outline: 'none' }} />
        </div>
        <div style=${{ overflowX: 'auto' }}>
          <table style=${{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style=${{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style=${th}>Account</th><th style=${th}>Sector</th><th style=${th}>Use Case</th><th style=${th}>People</th><th style=${{ ...th, textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>${filteredCompanies.map((co) => html`
              <tr style=${{ borderBottom: '1px solid #f1f5f9' }}>
                <td style=${{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, minWidth: '200px' }}>
                  <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <${Logo} name=${co.name} logoUrl=${co.logoUrl} />
                    <button onClick=${() => { setDetail(co.id); setDetailTab('overview'); }} style=${{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: BRAND.c600, textAlign: 'left' }}>${co.name}</button>
                  </div>
                </td>
                <td style=${{ padding: '12px 16px', fontSize: '14px', color: '#475569', whiteSpace: 'nowrap' }}>${co.sector}</td>
                <td style=${{ padding: 0, maxWidth: '340px' }}>
                  <input value=${co.useCase || ''} onInput=${(e) => localAccount(co.id, { useCase: e.target.value })} onChange=${(e) => saveAccount(co.id, { useCase: e.target.value })} placeholder="Add use case..." style=${{ width: '100%', border: 'none', background: 'transparent', fontSize: '13px', color: '#475569', padding: '12px 16px', outline: 'none' }} />
                </td>
                <td style=${{ padding: '12px 16px', fontSize: '14px', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>${peopleCount(co.id)}</td>
                <td style=${{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick=${() => openEditCompany(co)} style=${{ fontSize: '12px', fontWeight: 500, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', marginRight: '14px' }}>Edit</button>
                  <button onClick=${() => delAccount(co)} style=${{ fontSize: '12px', fontWeight: 500, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>`)}</tbody>
          </table>
          ${filteredCompanies.length === 0 && html`<div style=${{ padding: '40px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No accounts match your search.</div>`}
        </div>
      </div>

      <div style=${{ ...card, overflow: 'hidden', marginTop: '24px' }}>
        <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style=${{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Strategic Partners</h2>
          <button onClick=${openNewPartner} style=${{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 500, background: '#fff', color: '#475569' }}>＋ New Partner</button>
        </div>
        <div style=${{ overflowX: 'auto' }}>
          <table style=${{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style=${{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style=${{ ...th, padding: '12px 20px' }}>Partner</th><th style=${{ ...th, padding: '12px 20px' }}>Offering</th><th style=${{ ...th, padding: '12px 20px', textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>${partners.map((p) => html`
              <tr style=${{ borderBottom: '1px solid #f1f5f9' }}>
                <td style=${{ padding: '12px 20px', fontSize: '14px', fontWeight: 500 }}>
                  <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <${Logo} name=${p.name} logoUrl=${p.logoUrl} />
                    <span>${p.name}</span>
                  </div>
                </td>
                <td style=${{ padding: '12px 20px', fontSize: '14px', color: '#475569' }}>${p.offering}</td>
                <td style=${{ padding: '12px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick=${() => openEditPartner(p)} style=${{ fontSize: '12px', fontWeight: 500, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', marginRight: '14px' }}>Edit</button>
                  <button onClick=${() => delPartner(p)} style=${{ fontSize: '12px', fontWeight: 500, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>`)}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  const contactsView = html`
    <div>
      <div style=${{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style=${{ fontSize: '22px', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Stakeholders</h1>
          <p style=${{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>${contacts.length} named stakeholders across ${accounts.length} accounts</p>
        </div>
        <button onClick=${openNewContact} style=${{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '9px 14px', fontSize: '14px', fontWeight: 500, background: BRAND.c600, color: '#fff' }}>＋ New Stakeholder</button>
      </div>
      <div style=${{ ...card, overflow: 'hidden' }}>
        <div style=${{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <input value=${contactSearch} onInput=${(e) => setContactSearch(e.target.value)} placeholder="Search by name, account, or role..." style=${{ flex: 1, minWidth: '220px', maxWidth: '320px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '14px', outline: 'none' }} />
        </div>
        <div style=${{ overflowX: 'auto' }}>
          <table style=${{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style=${{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style=${th}>Name</th><th style=${th}>Role</th><th style=${th}>Account</th><th style=${{ ...th, textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>${filteredContacts.map((c) => { const a = accountById(c.companyId); return html`
              <tr style=${{ borderBottom: '1px solid #f1f5f9' }}>
                <td style=${{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>${(c.firstName + ' ' + (c.lastName || '')).trim()}</td>
                <td style=${{ padding: 0 }}>
                  <input value=${c.role || ''} onInput=${(e) => localContact(c.id, { role: e.target.value })} onChange=${(e) => saveContact(c.id, { role: e.target.value })} placeholder="Add role..." style=${{ width: '100%', border: 'none', background: 'transparent', fontSize: '14px', color: '#475569', padding: '12px 16px', outline: 'none' }} />
                </td>
                <td style=${{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>${a ? a.name : '—'}</td>
                <td style=${{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick=${() => openEditContact(c)} style=${{ fontSize: '12px', fontWeight: 500, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', marginRight: '14px' }}>Edit</button>
                  <button onClick=${() => delContact(c)} style=${{ fontSize: '12px', fontWeight: 500, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>`; })}</tbody>
          </table>
          ${filteredContacts.length === 0 && html`<div style=${{ padding: '40px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No stakeholders match your search.</div>`}
        </div>
      </div>
    </div>`;

  const analyticsView = html`
    <div>
      <div style=${{ marginBottom: '24px' }}>
        <h1 style=${{ fontSize: '22px', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style=${{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Coverage by sector and account.</p>
      </div>
      <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        ${[['Accounts', accounts.length], ['Stakeholders', contacts.length], ['Strategic Partners', partners.length], ['Sectors', Object.keys(secMap).length]].map(([t, v]) => html`
          <div style=${{ ...card, padding: '20px' }}>
            <div style=${{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>${t}</div>
            <div style=${{ fontSize: '26px', fontWeight: 600, marginTop: '6px', letterSpacing: '-0.02em' }}>${v}</div>
          </div>`)}
      </div>
      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div style=${{ ...card, padding: '20px' }}>
          <h2 style=${{ fontSize: '14px', fontWeight: 600, margin: '0 0 18px' }}>Accounts by Sector</h2>
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>${secArr.map((s) => html`
            <div style=${{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style=${{ fontSize: '12px', color: '#475569', width: '120px', flex: 'none', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${s.label}</span>
              <div style=${{ flex: 1, height: '18px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}><div style=${{ height: '100%', borderRadius: '5px', background: BRAND.c500, width: Math.round((s.count / maxSec) * 100) + '%' }}></div></div>
              <span style=${{ fontSize: '12px', fontWeight: 600, width: '24px', flex: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${s.count}</span>
            </div>`)}</div>
        </div>
        <div style=${{ ...card, padding: '20px' }}>
          <h2 style=${{ fontSize: '14px', fontWeight: 600, margin: '0 0 18px' }}>Best-Covered Accounts</h2>
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>${covArr.length ? covArr.map((c) => html`
            <div style=${{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style=${{ fontSize: '12px', color: '#475569', width: '150px', flex: 'none', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${c.label}</span>
              <div style=${{ flex: 1, height: '18px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}><div style=${{ height: '100%', borderRadius: '5px', background: BRAND.c500, width: Math.round((c.count / maxCov) * 100) + '%' }}></div></div>
              <span style=${{ fontSize: '12px', fontWeight: 600, width: '24px', flex: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${c.count}</span>
            </div>`) : html`<div style=${{ fontSize: '13px', color: '#94a3b8' }}>No stakeholders assigned yet.</div>`}</div>
        </div>
      </div>
    </div>`;

  const holisticView = html`
    <div>
      <div style=${{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style=${{ fontSize: '22px', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Holistic View</h1>
          <p style=${{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Track each account's stage, owner, and next step — edit inline.</p>
        </div>
        <button onClick=${openNewCompany} style=${{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '9px 14px', fontSize: '14px', fontWeight: 500, background: BRAND.c600, color: '#fff' }}>＋ New Account</button>
      </div>
      <div style=${{ ...card, overflow: 'hidden' }}>
        <div style=${{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <input value=${holisticSearch} onInput=${(e) => setHolisticSearch(e.target.value)} placeholder="Search account or next step..." style=${{ flex: 1, minWidth: '220px', maxWidth: '320px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '14px', outline: 'none' }} />
          <select value=${holisticStageFilter} onChange=${(e) => setHolisticStageFilter(e.target.value)} style=${{ borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '14px', outline: 'none', background: '#fff', minWidth: '150px' }}>
            <option value="ALL">All stages</option>
            ${STAGE_OPTIONS.map((so) => html`<option value=${so}>${so}</option>`)}
          </select>
        </div>
        <div style=${{ overflowX: 'auto' }}>
          <table style=${{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              ${['#', 'Account', 'Contact', 'Stage', 'Next Steps'].map((label, i) => html`<th style=${{ border: '1px solid #e2e8f0', background: '#f1f5f9', padding: '10px 12px', textAlign: i === 0 ? 'center' : 'left', width: i === 0 ? '44px' : 'auto', minWidth: i === 2 ? '170px' : i === 3 ? '150px' : i === 4 ? '300px' : 'auto', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: '#475569' }}>${label}</th>`)}
            </tr></thead>
            <tbody>${holisticRows.map((r, i) => html`
              <tr>
                <td style=${{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', background: '#f8fafc' }}>${i + 1}</td>
                <td style=${{ border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '14px', fontWeight: 500, background: '#fff' }}>${r.name}</td>
                <td style=${{ border: '1px solid #e2e8f0', padding: 0, background: '#fff' }}>
                  <input value=${r.contactName || ''} onInput=${(e) => localAccount(r.id, { contactName: e.target.value })} onChange=${(e) => saveAccount(r.id, { contactName: e.target.value })} placeholder="Add name..." style=${{ width: '100%', border: 'none', background: 'transparent', fontSize: '13px', padding: '8px 12px', outline: 'none' }} />
                </td>
                <td style=${{ border: '1px solid #e2e8f0', padding: '4px 6px', background: '#fff' }}>
                  <select value=${r.stage || 'Not Started'} onChange=${(e) => editAccount(r.id, { stage: e.target.value })} style=${stageSelectStyle(r.stage || 'Not Started')}>
                    ${STAGE_OPTIONS.map((so) => html`<option value=${so}>${so}</option>`)}
                  </select>
                </td>
                <td style=${{ border: '1px solid #e2e8f0', padding: 0, background: '#fff' }}>
                  <input value=${r.nextSteps || ''} onInput=${(e) => localAccount(r.id, { nextSteps: e.target.value })} onChange=${(e) => saveAccount(r.id, { nextSteps: e.target.value })} placeholder="Add next step..." style=${{ width: '100%', border: 'none', background: 'transparent', fontSize: '13px', padding: '8px 12px', outline: 'none' }} />
                </td>
              </tr>`)}</tbody>
          </table>
          ${holisticRows.length === 0 && html`<div style=${{ padding: '40px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No accounts match your filters.</div>`}
        </div>
      </div>
    </div>`;

  const views = { dashboard, companies: companiesView, contacts: contactsView, analytics: analyticsView, holistic: holisticView };

  /* ---- modal ---- */
  const logoField = html`
    <div>
      <label style=${labelStyle}>Logo</label>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <${Logo} name=${form.name || ''} logoUrl=${form.logoUrl || ''} size=${44} radius=${10} />
        <label style=${{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 500 }}>
          ${form.logoUrl ? 'Replace image' : 'Upload image'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange=${onLogoFile} style=${{ display: 'none' }} />
        </label>
        ${form.logoUrl && html`<button type="button" onClick=${() => setForm((f) => ({ ...f, logoUrl: '' }))} style=${{ fontSize: '13px', fontWeight: 500, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>`}
      </div>
      <div style=${{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>PNG, JPG or WebP. Overrides the auto-fetched logo.</div>
    </div>`;

  const modalEl = modal && html`
    <div onClick=${closeModal} style=${{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', zIndex: 50, overflowY: 'auto' }}>
      <div onClick=${(e) => e.stopPropagation()} style=${{ background: '#fff', borderRadius: '16px', width: '540px', maxWidth: '100%', boxShadow: '0 20px 60px rgba(15,23,42,.25)' }}>
        <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style=${{ fontSize: '16px', fontWeight: 600, margin: 0 }}>${({ contact: 'Stakeholder', company: 'Account', partner: 'Partner' })[modal.type] && (modal.mode === 'edit' ? 'Edit ' : 'New ') + ({ contact: 'Stakeholder', company: 'Account', partner: 'Partner' })[modal.type]}</h3>
          <button onClick=${closeModal} style=${{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex', fontSize: '20px', lineHeight: 1 }}>✕</button>
        </div>
        <div style=${{ padding: '22px' }}>
          ${modal.type === 'contact' && html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style=${labelStyle}>First name</label><input name="firstName" value=${form.firstName || ''} onInput=${onFormInput} style=${fieldStyle} /></div>
                <div><label style=${labelStyle}>Last name</label><input name="lastName" value=${form.lastName || ''} onInput=${onFormInput} style=${fieldStyle} /></div>
              </div>
              <div><label style=${labelStyle}>Role</label><input name="role" value=${form.role || ''} onInput=${onFormInput} placeholder="e.g. IT Director" style=${fieldStyle} /></div>
              <div><label style=${labelStyle}>Account</label>
                <select name="companyId" value=${form.companyId || ''} onInput=${onFormInput} style=${{ ...fieldStyle, background: '#fff' }}>
                  <option value="">— Select account —</option>
                  ${accounts.map((a) => html`<option value=${a.id}>${a.name}</option>`)}
                </select>
              </div>
            </div>`}
          ${modal.type === 'company' && html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              ${logoField}
              <div><label style=${labelStyle}>Account name</label><input name="name" value=${form.name || ''} onInput=${onFormInput} style=${fieldStyle} /></div>
              <div><label style=${labelStyle}>Sector</label><input name="sector" value=${form.sector || ''} onInput=${onFormInput} style=${fieldStyle} /></div>
              <div><label style=${labelStyle}>Priority</label>
                <select name="priority" value=${form.priority || 'High'} onInput=${onFormInput} style=${{ ...fieldStyle, background: '#fff' }}><option value="High">High</option><option value="Medium">Medium</option></select>
              </div>
              <div><label style=${labelStyle}>Use case</label><input name="useCase" value=${form.useCase || ''} onInput=${onFormInput} style=${fieldStyle} /></div>
              <div><label style=${labelStyle}>Why this fits</label><input name="why" value=${form.why || ''} onInput=${onFormInput} style=${fieldStyle} /></div>
            </div>`}
          ${modal.type === 'partner' && html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              ${logoField}
              <div><label style=${labelStyle}>Partner name</label><input name="name" value=${form.name || ''} onInput=${onFormInput} style=${fieldStyle} /></div>
              <div><label style=${labelStyle}>Offering</label><input name="offering" value=${form.offering || ''} onInput=${onFormInput} style=${fieldStyle} /></div>
            </div>`}

          ${formError && html`<div style=${{ marginTop: '16px', fontSize: '13px', color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '9px 12px' }}>${formError}</div>`}

          <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
            <button onClick=${closeModal} style=${{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', borderRadius: '8px', padding: '8px 14px', fontSize: '14px', fontWeight: 500 }}>Cancel</button>
            <button onClick=${saveForm} style=${{ border: 'none', background: BRAND.c600, color: '#fff', cursor: 'pointer', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 500 }}>${modal.mode === 'edit' ? 'Save changes' : 'Add ' + ({ contact: 'stakeholder', company: 'account', partner: 'partner' })[modal.type]}</button>
          </div>
        </div>
      </div>
    </div>`;

  /* ---- account detail drawer ---- */
  const detailAcc = detail && accounts.find((a) => a.id === detail);
  const detailContacts = detailAcc ? contacts.filter((c) => c.companyId === detailAcc.id) : [];
  const addDetailContact = async () => {
    if (!String(dcForm.firstName || '').trim()) return;
    try {
      const d = await api.post('/contacts', { firstName: dcForm.firstName, lastName: dcForm.lastName, role: dcForm.role, companyId: detailAcc.id });
      setContacts((l) => [d, ...l]);
      setDcForm({ firstName: '', lastName: '', role: '' });
    } catch (e) { showErr(e); }
  };
  const dLabel = { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: '#94a3b8', marginBottom: '6px' };
  const dTab = (active) => ({ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 2px', marginRight: '22px', fontSize: '14px', fontWeight: active ? 600 : 500, color: active ? BRAND.c600 : '#64748b', borderBottom: active ? '2px solid ' + BRAND.c600 : '2px solid transparent' });
  const detailEl = detailAcc && html`
    <div onClick=${() => setDetail(null)} style=${{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', justifyContent: 'flex-end', zIndex: 60 }}>
      <div onClick=${(e) => e.stopPropagation()} style=${{ width: '560px', maxWidth: '100%', height: '100%', background: '#fff', boxShadow: '-24px 0 60px rgba(15,23,42,.22)', display: 'flex', flexDirection: 'column' }}>
        <div style=${{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <${Logo} name=${detailAcc.name} logoUrl=${detailAcc.logoUrl} size=${54} radius=${13} />
          <div style=${{ flex: 1, minWidth: 0 }}>
            <h3 style=${{ fontSize: '19px', fontWeight: 600, margin: '0 0 3px', letterSpacing: '-0.01em' }}>${detailAcc.name}</h3>
            <div style=${{ fontSize: '13px', color: '#64748b' }}>${detailAcc.sector || 'No sector'}</div>
            <div style=${{ display: 'flex', gap: '8px', marginTop: '11px', flexWrap: 'wrap' }}>
              <span style=${priorityStyle(detailAcc.priority)}>${detailAcc.priority}</span>
            </div>
          </div>
          <button onClick=${() => setDetail(null)} style=${{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', lineHeight: 1, padding: '4px' }}>✕</button>
        </div>
        <div style=${{ display: 'flex', padding: '0 24px', borderBottom: '1px solid #eef2f7' }}>
          <button onClick=${() => setDetailTab('overview')} style=${dTab(detailTab === 'overview')}>Overview</button>
          <button onClick=${() => setDetailTab('contacts')} style=${dTab(detailTab === 'contacts')}>Contacts · ${detailContacts.length}</button>
        </div>
        <div style=${{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          ${detailTab === 'overview' && html`
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style=${{ gridColumn: '1 / -1' }}>
                <div style=${dLabel}>Website</div>
                <div style=${{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input value=${detailAcc.website || ''} onInput=${(e) => localAccount(detailAcc.id, { website: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { website: e.target.value })} placeholder="domain.com" style=${{ ...fieldStyle, flex: 1 }} />
                  ${detailAcc.website && html`<a href=${'https://' + String(detailAcc.website).replace('https://', '').replace('http://', '')} target="_blank" rel="noopener" style=${{ fontSize: '13px', fontWeight: 600, color: BRAND.c600, textDecoration: 'none', whiteSpace: 'nowrap', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>Visit ↗</a>`}
                </div>
              </div>
              <div>
                <div style=${dLabel}>Phone</div>
                <input value=${detailAcc.phone || ''} onInput=${(e) => localAccount(detailAcc.id, { phone: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { phone: e.target.value })} placeholder="Add phone" style=${fieldStyle} />
              </div>
              <div>
                <div style=${dLabel}>Headquarters</div>
                <input value=${detailAcc.hq || ''} onInput=${(e) => localAccount(detailAcc.id, { hq: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { hq: e.target.value })} placeholder="Add location" style=${fieldStyle} />
              </div>
              <div>
                <div style=${dLabel}>Employees</div>
                <input value=${detailAcc.employees || ''} onInput=${(e) => localAccount(detailAcc.id, { employees: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { employees: e.target.value })} placeholder="Add size" style=${fieldStyle} />
              </div>
              <div>
                <div style=${dLabel}>Operation size</div>
                <input value=${detailAcc.orgSize || ''} onInput=${(e) => localAccount(detailAcc.id, { orgSize: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { orgSize: e.target.value })} placeholder="Add type" style=${fieldStyle} />
              </div>
              <div style=${{ gridColumn: '1 / -1' }}>
                <div style=${dLabel}>Engagement stage</div>
                <select value=${detailAcc.stage || 'Not Started'} onChange=${(e) => editAccount(detailAcc.id, { stage: e.target.value })} style=${stageSelectStyle(detailAcc.stage || 'Not Started')}>
                  ${STAGE_OPTIONS.map((so) => html`<option value=${so}>${so}</option>`)}
                </select>
              </div>
              <div style=${{ gridColumn: '1 / -1' }}>
                <div style=${dLabel}>Owner / Contact</div>
                <input value=${detailAcc.contactName || ''} onInput=${(e) => localAccount(detailAcc.id, { contactName: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { contactName: e.target.value })} placeholder="Add owner..." style=${fieldStyle} />
              </div>
            </div>
            <div>
              <div style=${dLabel}>About</div>
              <textarea value=${detailAcc.description || ''} onInput=${(e) => localAccount(detailAcc.id, { description: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { description: e.target.value })} rows=${3} style=${{ ...fieldStyle, lineHeight: 1.55, resize: 'vertical', fontFamily: 'inherit' }}></textarea>
            </div>
            <div>
              <div style=${dLabel}>Use case</div>
              <input value=${detailAcc.useCase || ''} onInput=${(e) => localAccount(detailAcc.id, { useCase: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { useCase: e.target.value })} placeholder="Add use case..." style=${fieldStyle} />
            </div>
            <div>
              <div style=${dLabel}>Why this fits</div>
              <textarea value=${detailAcc.why || ''} onInput=${(e) => localAccount(detailAcc.id, { why: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { why: e.target.value })} placeholder="Why this account?" rows=${2} style=${{ ...fieldStyle, lineHeight: 1.55, resize: 'vertical', fontFamily: 'inherit' }}></textarea>
            </div>
            <div>
              <div style=${dLabel}>Next steps</div>
              <input value=${detailAcc.nextSteps || ''} onInput=${(e) => localAccount(detailAcc.id, { nextSteps: e.target.value })} onChange=${(e) => saveAccount(detailAcc.id, { nextSteps: e.target.value })} placeholder="Add next step..." style=${fieldStyle} />
            </div>
          </div>`}
          ${detailTab === 'contacts' && html`
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            ${detailContacts.map((c) => html`
              <div style=${{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '1px solid #eef2f7', borderRadius: '10px', background: '#fff' }}>
                <span style=${{ height: '34px', width: '34px', flex: 'none', borderRadius: '50%', background: BRAND.c50, color: BRAND.c700, display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 600 }}>${initials((c.firstName + ' ' + (c.lastName || '')).trim())}</span>
                <div style=${{ flex: 1, minWidth: 0 }}>
                  <div style=${{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>${(c.firstName + ' ' + (c.lastName || '')).trim()}</div>
                  <div style=${{ fontSize: '12px', color: '#64748b' }}>${c.role || '—'}</div>
                </div>
                <button onClick=${() => { setDetail(null); openEditContact(c); }} style=${{ fontSize: '12px', fontWeight: 500, color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick=${() => delContact(c)} style=${{ fontSize: '12px', fontWeight: 500, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              </div>`)}
            ${detailContacts.length === 0 && html`<div style=${{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '10px' }}>No contacts yet. Add the first one below.</div>`}
            <div style=${{ marginTop: '6px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style=${{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Add contact</div>
              <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input value=${dcForm.firstName} onInput=${(e) => setDcForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="First name" style=${fieldStyle} />
                <input value=${dcForm.lastName} onInput=${(e) => setDcForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Last name" style=${fieldStyle} />
              </div>
              <input value=${dcForm.role} onInput=${(e) => setDcForm((f) => ({ ...f, role: e.target.value }))} placeholder="Role (e.g. IT Director)" style=${fieldStyle} />
              <button onClick=${addDetailContact} style=${{ alignSelf: 'flex-start', border: 'none', background: BRAND.c600, color: '#fff', cursor: 'pointer', borderRadius: '8px', padding: '9px 16px', fontSize: '14px', fontWeight: 500 }}>Add contact</button>
            </div>
          </div>`}
        </div>
        <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick=${() => delAccount(detailAcc)} style=${{ fontSize: '13px', fontWeight: 500, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Delete account</button>
          <button onClick=${() => { setDetail(null); openEditCompany(detailAcc); }} style=${{ border: 'none', background: BRAND.c600, color: '#fff', cursor: 'pointer', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 500 }}>Edit details</button>
        </div>
      </div>
    </div>`;

  return html`
    <div style=${{ display: 'flex', minHeight: '100vh' }}>
      <aside style=${{ width: '256px', flex: 'none', borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style=${{ padding: '22px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style=${{ height: '38px', width: '38px', flex: 'none', borderRadius: '10px', background: BRAND.c600, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '14px', letterSpacing: '0.02em' }}>IFM</div>
          <div style=${{ minWidth: 0 }}>
            <div style=${{ fontSize: '14px', fontWeight: 600 }}>Internal CRM Tool</div>
            <div style=${{ fontSize: '12px', color: '#64748b' }}>IFM Account List</div>
          </div>
        </div>
        <nav style=${{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          ${navItem('dashboard', 'Dashboard', icons.dashboard)}
          ${navItem('companies', 'Accounts', icons.accounts)}
          ${navItem('contacts', 'Stakeholders', icons.contacts)}
          ${navItem('analytics', 'Analytics', icons.analytics)}
          ${navItem('holistic', 'Holistic View', icons.holistic)}
        </nav>
        <div style=${{ padding: '12px', borderTop: '1px solid #e2e8f0' }}>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px 10px' }}>
            <span style=${{ height: '7px', width: '7px', borderRadius: '999px', background: live ? '#16a34a' : '#cbd5e1', flex: 'none' }}></span>
            <span style=${{ fontSize: '11px', color: '#94a3b8' }}>${live ? 'Live — synced' : 'Reconnecting…'}</span>
          </div>
          <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '0 12px' }}>
            <div style=${{ minWidth: 0 }}>
              <div style=${{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${user.name || user.email}</div>
              <div style=${{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${user.email}</div>
            </div>
            <button onClick=${logout} title="Sign out" style=${{ flex: 'none', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 500 }}>Sign out</button>
          </div>
        </div>
      </aside>

      <main style=${{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style=${{ padding: '32px 36px 56px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          ${views[route]}
        </div>
      </main>

      ${modalEl}
      ${detailEl}

      ${toast && html`<div style=${{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', fontSize: '13px', padding: '10px 16px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(15,23,42,.3)', zIndex: 60 }}>${toast}</div>`}
    </div>`;
}

render(html`<${App} />`, document.getElementById('root'));
