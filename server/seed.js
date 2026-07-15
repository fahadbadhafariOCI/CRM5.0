'use strict';

const { pool } = require('./db');

// ── Source data imported from "Abu Dhabi LandScape.xlsx" ──
// Columns: Account, Product, Priority, Use Case, External Contact(s).
// `ext` is the raw External Contact string; it's parsed into stakeholders
// below (splitting on "/" and " - ", with roles read from parentheses).
const ACCOUNTS = [
  { name: 'Abu Dhabi Executive Council', product: 'Jais', priority: 'High', useCase: 'Policy decision support; Arabic public communications', ext: 'Saeed Belhoul' },
  { name: 'Department of Government Enablement', product: 'Jais', priority: 'High', useCase: 'Shared gov services; process automation', ext: '' },
  { name: 'Abu Dhabi Digital Authority (TAMM)', product: 'Jais', priority: 'High', useCase: 'Sovereign AI platform owner; TAMM services', ext: '' },
  { name: 'Abu Dhabi Human Resources Authority', product: 'Jais', priority: 'Medium', useCase: 'Arabic HR self-service; policy Q&A', ext: '' },
  { name: 'Statistics Centre', product: 'Jais', priority: 'High', useCase: 'Statistical analysis; data interpretation', ext: 'Mariam Al Suwaidi' },
  { name: 'Abu Dhabi Competitiveness Office', product: 'Jais', priority: 'Medium', useCase: 'Economic benchmarking & analysis', ext: 'Easam Al Ali' },
  { name: 'General Secretariat of the Executive Council', product: 'Jais', priority: 'Medium', useCase: 'Arabic minutes, drafting, correspondence', ext: '' },
  { name: 'Department of Health', product: 'Jais', priority: 'High', useCase: 'Clinical decision support; Arabic patient engagement', ext: '' },
  { name: 'SEHA', product: 'Jais', priority: 'High', useCase: 'Hospital ops; patient services', ext: '' },
  { name: 'Department of Municipalities and Transport', product: 'Jais', priority: 'High', useCase: 'Urban planning; citizen permits', ext: '' },
  { name: 'Abu Dhabi Projects & Infrastructure Centre', product: 'Jais', priority: 'Medium', useCase: 'Project planning & cost reasoning', ext: '' },
  { name: 'Abu Dhabi Airports', product: 'Jais', priority: 'High', useCase: 'Ops optimization; passenger experience', ext: 'Eng . Abdulwahed Amiri / Wesam' },
  { name: 'Abu Dhabi Ports', product: 'Jais', priority: 'High', useCase: 'Logistics & supply-chain optimization', ext: 'Marwan - Mohammed Al Agha' },
  { name: 'Abu Dhabi Housing Authority', product: 'Jais', priority: 'Medium', useCase: 'Eligibility reasoning; Arabic applications', ext: 'Yousef - Tajamul - Adeel - Sultan' },
  { name: 'Department of Energy', product: 'Jais', priority: 'High', useCase: 'Demand forecasting; grid optimization', ext: 'Qutaiba Al Hammadi' },
  { name: 'TAQA', product: 'Jais', priority: 'High', useCase: 'Asset & portfolio optimization', ext: 'Rashed Mudhafar' },
  { name: 'Environment Agency', product: 'Jais', priority: 'Medium', useCase: 'Environmental modeling & monitoring', ext: '' },
  { name: 'Department of Finance', product: 'Jais', priority: 'High', useCase: 'Budget modeling; audit & fraud reasoning', ext: 'Eisa Al Hammadi (Head of Apps) - Waleed Al Masri' },
  { name: 'Abu Dhabi Global Market', product: 'Jais', priority: 'High', useCase: 'Regulatory & legal reasoning; compliance', ext: 'Obaid - Mohammed - Safta - Khaled Al Marzooqi' },
  { name: 'Department of Culture and Tourism', product: 'Jais', priority: 'High', useCase: 'Arabic cultural content; tourism', ext: 'Hessa Al Nahdi - Manish - Shahul Hamed' },
  { name: 'Abu Dhabi National Exhibition Centre', product: 'Jais', priority: 'High', useCase: 'Multilingual visitor services', ext: 'Ahmed Al Marzooqi (IT Director)' },
  { name: 'ADQ', product: 'Jais', priority: 'High', useCase: 'Portfolio & investment analysis', ext: 'Eida - Sameh - Thomas' },
];

const PARTNERS = [
  { name: 'Microsoft', offering: 'Azure & Copilot' },
  { name: 'Amazon Web Services', offering: 'Cloud & Bedrock' },
  { name: 'G42', offering: 'Sovereign AI & compute' },
  { name: 'UnifyApps', offering: 'Agentic AI platform' },
  { name: 'Dataiku', offering: 'Data science platform' },
  { name: 'Oracle', offering: 'OCI cloud & apps' },
  { name: 'NVIDIA', offering: 'GPU compute' },
  { name: 'Core42', offering: 'Sovereign cloud' },
  { name: 'Presight', offering: 'Data analytics & AI' },
  { name: 'UiPath', offering: 'Data science platform' },
];

// Profile enrichment shown in the account detail drawer, keyed by account name.
// Backfilled into existing rows on boot (only where website is still empty).
const ENRICH = {
  'Abu Dhabi Executive Council': { website: 'ec.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '500–1,000 (est.)', orgSize: 'Emirate executive authority', description: 'The principal executive authority of the Emirate of Abu Dhabi, overseeing government departments and strategic policy.' },
  'Department of Government Enablement': { website: 'dge.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '1,000–5,000 (est.)', orgSize: 'Central government function', description: 'Central body driving government efficiency, shared services, and digital enablement across Abu Dhabi entities.' },
  'Abu Dhabi Digital Authority (TAMM)': { website: 'adda.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '500–1,000 (est.)', orgSize: 'Sovereign digital platform', description: "Abu Dhabi's digital government authority and owner of the unified TAMM services platform." },
  'Abu Dhabi Human Resources Authority': { website: 'hra.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '200–500 (est.)', orgSize: 'Government authority', description: 'Regulator of HR policy and services for the Abu Dhabi government workforce.' },
  'Statistics Centre': { website: 'scad.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '200–500 (est.)', orgSize: 'Statistical authority', description: 'The official statistical authority producing economic, social, and demographic data for Abu Dhabi.' },
  'Abu Dhabi Competitiveness Office': { website: 'added.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '50–200 (est.)', orgSize: 'Government office', description: "Drives Abu Dhabi's competitiveness agenda and global index performance (under ADDED)." },
  'General Secretariat of the Executive Council': { website: 'ec.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '200–500 (est.)', orgSize: 'Council secretariat', description: "Secretariat supporting the Abu Dhabi Executive Council's decision-making and coordination." },
  'Department of Health': { website: 'doh.gov.ae', phone: '800 11111', hq: 'Abu Dhabi, UAE', employees: '500–1,000 (est.)', orgSize: 'Health regulator', description: "Regulator of Abu Dhabi's healthcare sector, setting policy and quality standards." },
  'SEHA': { website: 'seha.ae', phone: '+971 2 410 2000', hq: 'Abu Dhabi, UAE', employees: '15,000+ (est.)', orgSize: 'Public hospital network', description: "Abu Dhabi Health Services Company — operator of the emirate's public hospitals and clinics." },
  'Department of Municipalities and Transport': { website: 'dmt.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '5,000–10,000 (est.)', orgSize: 'Municipal & transport authority', description: 'Oversees urban planning, municipal services, and transport across Abu Dhabi.' },
  'Abu Dhabi Projects & Infrastructure Centre': { website: 'adpic.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '200–500 (est.)', orgSize: 'Infrastructure authority', description: "Central authority governing planning, procurement, and delivery of Abu Dhabi's capital projects." },
  'Abu Dhabi Airports': { website: 'abudhabiairport.ae', phone: '+971 2 505 5555', hq: 'Abu Dhabi, UAE', employees: '3,000–5,000 (est.)', orgSize: 'Airport operator', description: "Operator of Zayed International Airport and the emirate's other airports." },
  'Abu Dhabi Ports': { website: 'adportsgroup.com', phone: '+971 2 695 2000', hq: 'Abu Dhabi, UAE', employees: '5,000–10,000', orgSize: 'Listed (ADX: ADPORTS)', description: 'Integrated trade, logistics, and industrial enabler operating ports and economic zones.' },
  'Abu Dhabi Housing Authority': { website: 'adha.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '200–500 (est.)', orgSize: 'Government authority', description: 'Delivers housing programs and citizen housing support for Abu Dhabi nationals.' },
  'Department of Energy': { website: 'doe.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '200–500 (est.)', orgSize: 'Energy regulator', description: 'Regulator of the electricity, water, and district-cooling sectors in Abu Dhabi.' },
  'TAQA': { website: 'taqa.com', phone: '+971 2 691 4000', hq: 'Abu Dhabi, UAE', employees: '~7,400', orgSize: 'Listed (ADX: TAQA)', description: "One of the region's largest listed utilities — power generation, water, and oil & gas." },
  'Environment Agency': { website: 'ead.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '500–1,000 (est.)', orgSize: 'Government agency', description: "Environment Agency – Abu Dhabi; protects the emirate's biodiversity, air, and water." },
  'Department of Finance': { website: 'dof.gov.ae', phone: '800 555', hq: 'Abu Dhabi, UAE', employees: '500–1,000 (est.)', orgSize: 'Government department', description: "Manages the emirate's public finances, budgeting, and treasury functions." },
  'Abu Dhabi Global Market': { website: 'adgm.com', phone: '+971 2 333 8888', hq: 'Al Maryah Island, Abu Dhabi', employees: '200–500 (est.)', orgSize: 'Financial free zone', description: 'International financial centre and free zone with its own legal and regulatory framework.' },
  'Department of Culture and Tourism': { website: 'dctabudhabi.ae', phone: '+971 2 444 0444', hq: 'Abu Dhabi, UAE', employees: '1,000–5,000 (est.)', orgSize: 'Government department', description: 'Department of Culture and Tourism – Abu Dhabi; heritage, culture, and destination marketing.' },
  'Abu Dhabi National Exhibition Centre': { website: 'adnec.ae', phone: '+971 2 444 6900', hq: 'Abu Dhabi, UAE', employees: '500–1,000 (est.)', orgSize: 'Events & venues operator', description: 'Operator of the Abu Dhabi National Exhibition Centre and major events venues.' },
  'ADQ': { website: 'adq.ae', phone: '+971 2 205 9000', hq: 'Abu Dhabi, UAE', employees: '500–1,000 (est.)', orgSize: 'Sovereign holding company', description: "One of the region's largest sovereign investors with a diversified portfolio across key sectors." },
};

// Split a raw External Contact cell into individual stakeholders.
// Handles "A / B", "A - B - C", roles in "(...)", and a leading "Eng ." title.
function parseStakeholders(raw) {
  if (!raw) return [];
  return raw
    .split(/\s*\/\s*|\s+-\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      let role = '';
      const pm = part.match(/\(([^)]+)\)/);
      if (pm) { role = pm[1].trim(); part = part.replace(/\([^)]*\)/, '').trim(); }
      part = part.replace(/^Eng\s*\.?\s*/i, '').trim(); // drop "Eng ." title
      const tokens = part.split(/\s+/).filter(Boolean);
      const firstName = tokens.shift() || '';
      const lastName = tokens.join(' ');
      return { firstName, lastName, role };
    })
    .filter((p) => p.firstName);
}

// Seeds the database the first time it runs (when accounts table is empty).
// Safe to call on every boot — it no-ops if data already exists. Also
// backfills profile enrichment into existing rows whose website is empty.
async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM accounts');
  if (rows[0].n > 0) return backfillEnrichment();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const a of ACCOUNTS) {
      const people = parseStakeholders(a.ext);
      const contactName = people.length ? (people[0].firstName + ' ' + people[0].lastName).trim() : '';
      const e = ENRICH[a.name] || {};
      const acc = await client.query(
        `INSERT INTO accounts (name, sector, product, priority, use_case, why, stage, next_steps, contact_name, website, phone, hq, employees, org_size, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [a.name, a.sector || '', a.product, a.priority, a.useCase, '', 'Not Started', '', contactName,
         e.website || '', e.phone || '', e.hq || '', e.employees || '', e.orgSize || '', e.description || '']
      );
      const accountId = acc.rows[0].id;
      for (const p of people) {
        await client.query(
          `INSERT INTO contacts (first_name, last_name, role, account_id) VALUES ($1,$2,$3,$4)`,
          [p.firstName, p.lastName, p.role, accountId]
        );
      }
    }
    for (const p of PARTNERS) {
      await client.query(`INSERT INTO partners (name, offering) VALUES ($1,$2)`, [p.name, p.offering]);
    }
    await client.query('COMMIT');
    console.log('Seeded database with imported Abu Dhabi landscape data.');
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Fill in profile fields for existing accounts that predate the enrichment
// columns. Only touches rows whose website is still empty, so anything the
// team has since edited is left alone.
async function backfillEnrichment() {
  for (const [name, e] of Object.entries(ENRICH)) {
    await pool.query(
      `UPDATE accounts SET website=$2, phone=$3, hq=$4, employees=$5, org_size=$6, description=$7
       WHERE name=$1 AND website=''`,
      [name, e.website || '', e.phone || '', e.hq || '', e.employees || '', e.orgSize || '', e.description || '']
    );
  }
  return false;
}

module.exports = { seedIfEmpty };
