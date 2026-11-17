// Genere l'export BoMarkdown de l'editeur (.bmd + _Icons.json) pour une base .db,
// en executant la vraie fonction buildBomarkdown() de modea-editeur.html dans jsdom.
// Usage : node scripts/export_bmd.cjs <base.db> <dossier-sortie>
// Dependance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const [dbPath, outDir] = process.argv.slice(2);
if (!dbPath || !outDir) { console.error('usage: node export_bmd.cjs <base.db> <dossier-sortie>'); process.exit(2); }
const root = path.resolve(__dirname, '..');

(async () => {
  const html = fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8');
  const w = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' }).window;
  if (!w.TextEncoder) w.TextEncoder = TextEncoder;
  await new Promise(r => setTimeout(r, 500));
  w.__bytes = new Uint8Array(fs.readFileSync(dbPath));
  await w.eval(`openBytes(__bytes, ${JSON.stringify(path.basename(dbPath))})`);
  const r = JSON.parse(w.eval('JSON.stringify(buildBomarkdown())'));
  const nom = path.basename(dbPath).replace(/\.(db|sqlite3?)$/, '');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, nom + '-vocabulaire.bmd'), r.bmd);
  fs.writeFileSync(path.join(outDir, nom + '_Icons.json'), JSON.stringify(r.icons, null, 2));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
