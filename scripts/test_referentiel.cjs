// Teste le nettoyage des valeurs inutilisées du référentiel (issue #21) et la migration v8 -> v9
// (colonne disposition des configurations du diagramme, issue #22), avec les vraies fonctions de
// modea-editeur.html dans jsdom.
// Usage : node scripts/test_referentiel.cjs      Dépendance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (!ok && detail ? ' -- ' + detail : ''));
  if (!ok) failures++;
};

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modea-ref-'));
  const moto = path.join(tmp, 'moto.db');
  cp.execFileSync('python3', [path.join(root, 'scripts', 'generate_sample_moto_db.py'), moto]);

  const w = new JSDOM(fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8'),
    { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: new VirtualConsole() }).window;
  await new Promise(r => setTimeout(r, 500));
  const q = sql => w.eval(`exec(${JSON.stringify(sql)})`);
  const n = t => q(`SELECT COUNT(*) n FROM ${t}`)[0].n;
  w.confirm = () => true;

  // ---- migration v8 -> v9
  w.__b = new Uint8Array(fs.readFileSync(moto));
  await w.eval(`(async()=>{ await ensureSql(); const d=new SQL.Database(__b);
    d.run("ALTER TABLE filtre_diagramme DROP COLUMN disposition"); d.run("PRAGMA user_version=8");
    await openBytes(d.export(),'v8.db'); d.close(); })()`);
  check('migration v8 -> v9 : version et colonne disposition',
    q('PRAGMA user_version')[0].user_version === 9 && q("SELECT 1 n FROM pragma_table_info('filtre_diagramme') WHERE name='disposition'").length === 1);

  // ---- nettoyage du référentiel
  w.eval(`run("INSERT INTO domaine(nom) VALUES ('ZZ inutile')"); run("INSERT INTO classe_objet(nom) VALUES ('Nature fantôme')");
    run("INSERT INTO verbe_relation(nom) VALUES ('jamais utilisé')"); run("INSERT INTO discipline(code,nom) VALUES ('77','Inutile')");
    ensureUnite('Grandeur fantôme','gf');`);
  const tables = ['domaine', 'classe_objet', 'verbe_relation', 'discipline', 'grandeur_physique', 'unite', 'objet', 'relation', 'propriete', 'applicabilite'];
  const avant = Object.fromEntries(tables.map(t => [t, n(t)]));
  const found = w.eval('findUnusedRef()').map(c => c.table + ':' + c.rows.map(r => r.nom).join('|'));
  check('valeurs inutilisées détectées (une par catégorie)', found.length === 5 && found.every(f => !f.includes('|')), found.join(' ; '));

  w.eval('cleanUnusedRef()');
  const apres = Object.fromEntries(tables.map(t => [t, n(t)]));
  check('une valeur retirée par catégorie (et l\'unité de la grandeur)',
    ['domaine', 'classe_objet', 'verbe_relation', 'discipline', 'grandeur_physique', 'unite'].every(t => apres[t] === avant[t] - 1), JSON.stringify({ avant, apres }));
  check('le modèle lui-même est intact', ['objet', 'relation', 'propriete', 'applicabilite'].every(t => apres[t] === avant[t]));
  check('plus rien à nettoyer, intégrité respectée', w.eval('findUnusedRef()').length === 0 && q('PRAGMA foreign_key_check').length === 0);
  w.eval('cleanUnusedRef()');
  check('second nettoyage : rien de supprimé', tables.every(t => n(t) === apres[t]));

  console.log(failures ? `\n${failures} échec(s)` : '\nTout est OK');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
