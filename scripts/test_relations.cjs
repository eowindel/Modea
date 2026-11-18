// Teste l'éditeur de relation et le nom technique (vraies fonctions de modea-editeur.html, dans jsdom) :
// création avec nom technique, modification d'une relation existante, annulation, migration v7 -> v8,
// export RDF.
// Usage : node scripts/test_relations.cjs      Dépendance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (!ok && detail ? ' -- ' + detail : ''));
  if (!ok) failures++;
};

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modea-rel-'));
  const moto = path.join(tmp, 'moto.db');
  cp.execFileSync('python3', [path.join(root, 'scripts', 'generate_sample_moto_db.py'), moto]);

  const w = new JSDOM(fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8'),
    { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: new VirtualConsole() }).window;
  await new Promise(r => setTimeout(r, 500));
  const q = sql => w.eval(`exec(${JSON.stringify(sql)})`);
  const set = (id, val) => { w.document.getElementById(id).value = val; };
  const val = id => w.document.getElementById(id).value;

  w.__b = new Uint8Array(fs.readFileSync(moto)); await w.eval(`openBytes(__b,'moto.db')`);
  check('schéma courant avec nom technique', q("SELECT 1 n FROM pragma_table_info('relation') WHERE name='nom_technique'").length === 1);
  const [a, b, c] = q("SELECT nom FROM objet ORDER BY nom LIMIT 3").map(r => r.nom);
  const nRel = () => q("SELECT COUNT(*) n FROM relation")[0].n;
  const avant = nRel();

  // 1) création avec nom technique
  set('r_src', a); set('r_tgt', b); set('r_nom', 'teste'); set('r_tech', ' REL_TEST ');
  w.eval('addRel()');
  const r1 = q("SELECT id,uid,nom_technique t FROM relation WHERE nom_technique IS NOT NULL")[0];
  check('création : nom technique enregistré (espaces retirés)', r1 && r1.t === 'REL_TEST' && nRel() === avant + 1);
  check('création : formulaire vidé', val('r_src') === '' && val('r_tech') === '');

  // 2) modification
  w.eval(`editRelRow(${r1.id})`);
  check('édition : formulaire prérempli', val('r_src') === a && val('r_tgt') === b && val('r_nom') === 'teste' && val('r_tech') === 'REL_TEST');
  check('édition : bouton « Mettre à jour »', w.document.getElementById('addRel').textContent === 'Mettre à jour la relation');
  set('r_tgt', c); set('r_type', 'composition'); set('r_cc', '1..*'); set('r_nom', 'contient'); set('r_tech', 'REL_CONTIENT');
  w.eval('addRel()');
  const r2 = q(`SELECT r.uid,c.nom tgt,r.type,r.card_cible cc,vb.nom verbe,r.nom_technique t FROM relation r
    JOIN objet c ON c.id=r.cible_id LEFT JOIN verbe_relation vb ON vb.id=r.verbe_id WHERE r.id=${r1.id}`)[0];
  check('édition : relation modifiée sur place (pas de doublon)', nRel() === avant + 1 && r2.uid === r1.uid);
  check('édition : cible, type, cardinalité, nom et nom technique mis à jour',
    r2.tgt === c && r2.type === 'composition' && r2.cc === '1..*' && r2.verbe === 'contient' && r2.t === 'REL_CONTIENT', JSON.stringify(r2));
  check('édition : retour au mode création', w.document.getElementById('addRel').textContent === 'Ajouter la relation');

  // 3) vider le nom technique, puis annuler une modification
  w.eval(`editRelRow(${r1.id})`); set('r_tech', ''); w.eval('addRel()');
  check('nom technique vidé -> NULL', q(`SELECT nom_technique t FROM relation WHERE id=${r1.id}`)[0].t === null);
  w.eval(`editRelRow(${r1.id})`); set('r_tech', 'NE_PAS_GARDER'); w.eval('resetRelForm()');
  check('annuler : rien n’est modifié', q(`SELECT nom_technique t FROM relation WHERE id=${r1.id}`)[0].t === null && val('r_src') === '');

  // 4) relation supprimée pendant sa modification
  w.eval(`editRelRow(${r1.id})`); w.eval(`run("DELETE FROM relation WHERE id=${r1.id}")`); w.eval('addRel()');
  check('relation supprimée entre-temps : pas recréée', nRel() === avant && w.eval('relEditUid') === null);

  // 5) export RDF
  set('r_src', a); set('r_tgt', b); set('r_nom', 'teste'); set('r_tech', 'REL_EXPORT'); w.eval('addRel()');
  const ttl = w.eval(`buildTurtle('http://example.org/modea#')`);
  check('export RDF : modea:nomTechnique présent', /modea:nomTechnique """REL_EXPORT"""/.test(ttl));

  // 6) migration d'une base v7
  const v7 = path.join(tmp, 'v7.db');
  fs.writeFileSync(path.join(tmp, 'v7.sql'), cp.execFileSync('git', ['-C', root, 'show', 'v0.8.1:metamodele.sql']));
  cp.execFileSync('python3', ['-c', `
import sqlite3,sys
c=sqlite3.connect(sys.argv[1]); c.executescript(open(sys.argv[2],encoding='utf-8').read())
c.executemany("INSERT INTO objet(nom) VALUES (?)", [('Produit',),('Pièce',)])
c.execute("INSERT INTO relation(source_id,cible_id) VALUES (1,2)"); c.commit()`, v7, path.join(tmp, 'v7.sql')]);
  w.__b = new Uint8Array(fs.readFileSync(v7)); await w.eval(`openBytes(__b,'v7.db')`);
  check('base v7 migrée : version et colonne', q("PRAGMA user_version")[0].user_version === w.eval('SCHEMA_VERSION')
    && q("SELECT 1 n FROM pragma_table_info('relation') WHERE name='nom_technique'").length === 1);
  w.eval(`editRelRow(${q("SELECT id FROM relation")[0].id})`); set('r_tech', 'MIGREE'); w.eval('addRel()');
  check('base v7 migrée : relation existante modifiable', q("SELECT nom_technique t FROM relation")[0].t === 'MIGREE');

  console.log('\n' + (failures ? 'ECHEC : ' : 'OK : ') + failures + ' test(s) en echec');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
