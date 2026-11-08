// Genere les exports Turtle de l'editeur (RDF/OWL, SHACL, liens) pour une base .db,
// en executant les vraies fonctions de modea-editeur.html dans jsdom (sans navigateur).
// Usage : node scripts/export_ttl.cjs <base.db> <dossier-sortie> [iri-de-base]
// Dependance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const [dbPath, outDir, baseArg] = process.argv.slice(2);
if (!dbPath || !outDir) { console.error('usage: node export_ttl.cjs <base.db> <dossier-sortie> [iri]'); process.exit(2); }
const root = path.resolve(__dirname, '..');
const base = baseArg || 'http://example.org/modea/test#';

(async () => {
  const html = fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8');
  const w = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' }).window;
  await new Promise(r => setTimeout(r, 500));
  w.__bytes = new Uint8Array(fs.readFileSync(dbPath));
  await w.eval(`openBytes(__bytes, ${JSON.stringify(path.basename(dbPath))})`);
  fs.mkdirSync(outDir, { recursive: true });
  const b = JSON.stringify(base);
  fs.writeFileSync(path.join(outDir, 'modele.ttl'), w.eval(`buildTurtle(${b})`));
  fs.writeFileSync(path.join(outDir, 'modele.shapes.ttl'), w.eval(`buildShacl(${b})`));
  fs.writeFileSync(path.join(outDir, 'modele.liens.ttl'), w.eval(`buildLiensTurtle(${b})`));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
