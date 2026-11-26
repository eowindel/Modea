// Teste le niveau de détail des objets (issue #33) : saisie, liste filtrée, duplication, référentiel,
// avec les vraies fonctions de modea-editeur.html dans jsdom.
// Usage : node scripts/test_niveau.cjs      Dépendance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (!ok && detail ? ' -- ' + detail : ''));
  if (!ok) failures++;
};
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modea-niv-'));
  const moto = path.join(tmp, 'moto.db');
  cp.execFileSync('python3', [path.join(root, 'scripts', 'generate_sample_moto_db.py'), moto]);
  const w = new JSDOM(fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8'),
    { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: new VirtualConsole() }).window;
  await new Promise(r => setTimeout(r, 500));
  const q = sql => w.eval(`exec(${JSON.stringify(sql)})`);
  w.confirm = () => true;
  w.__b = new Uint8Array(fs.readFileSync(moto));
  await w.eval(`openBytes(__b,'moto.db')`);

  const set = (id, val) => { w.document.getElementById(id).value = val; };
  const saisir = async (nom, niveau) => { set('o_nom', nom); set('o_niveau', niveau); await w.eval('addOrUpdateObjet()'); };
  await saisir('Obj A', 'Métier'); await saisir('Obj B', 'Applicatif'); await saisir('Obj C', 'Métier'); await saisir('Obj D', '');
  const niv = nom => (q(`SELECT nd.nom n FROM objet o LEFT JOIN niveau_detail nd ON nd.id=o.niveau_id WHERE o.nom='${nom}'`)[0] || {}).n;
  check('saisie : niveau créé et rattaché', niv('Obj A') === 'Métier' && niv('Obj B') === 'Applicatif');
  check('saisie : niveau réutilisé (pas de doublon)', q("SELECT COUNT(*) n FROM niveau_detail WHERE nom='Métier'")[0].n === 1);
  check('saisie : sans niveau = aucun', niv('Obj D') === null);

  // modification via le formulaire
  await w.eval(`editObjetRow(${q("SELECT id FROM objet WHERE nom='Obj A'")[0].id})`);
  check('édition : le niveau est rechargé dans le formulaire', w.document.getElementById('o_niveau').value === 'Métier');
  set('o_niveau', 'Applicatif'); await w.eval('addOrUpdateObjet()');
  check('édition : le niveau est modifié', niv('Obj A') === 'Applicatif');

  // liste filtrée
  const noms = () => [...w.document.querySelectorAll('#mgObjBody .mgname')].map(e => e.textContent);
  w.eval('refreshAll()');
  const opts = [...w.document.querySelectorAll('#mgObjNiveau option')].map(o => o.value);
  check('filtre de la liste : niveaux dans l\'ordre de création + « sans niveau »',
    JSON.stringify(opts.slice(0, 3)) === JSON.stringify(['', 'Métier', 'Applicatif']) && opts.includes('— sans niveau'), opts.join('|'));
  set('mgObjNiveau', 'Applicatif'); await w.eval('renderMgObjets()');
  check('filtre de la liste : niveau choisi', noms().sort().join() === 'Obj A,Obj B', noms().join());
  set('mgObjNiveau', '— sans niveau'); await w.eval('renderMgObjets()');
  check('filtre de la liste : sans niveau', noms().includes('Obj D') && !noms().includes('Obj A'));
  set('mgObjNiveau', ''); await w.eval('renderMgObjets()');
  check('colonne Niveau affichée', [...w.document.querySelectorAll('#mgObjBody tr.mgrow')].every(tr => tr.children.length === 9));

  // duplication
  w.prompt = () => 'Obj A bis';
  await w.eval(`duplicateObjet(${q("SELECT id FROM objet WHERE nom='Obj A'")[0].id})`);
  check('duplication : le niveau est recopié', niv('Obj A bis') === 'Applicatif');

  // référentiel
  const body = w.document.getElementById('ref_niveau_body');
  check('référentiel : onglet Niveaux de détail listé avec usages', body.textContent.includes('Métier') && body.textContent.includes('Applicatif'));
  await w.eval(`deleteRefRow('niveau', ${q("SELECT id FROM niveau_detail WHERE nom='Applicatif'")[0].id})`);
  check('référentiel : suppression refusée tant que le niveau est utilisé', q("SELECT COUNT(*) n FROM niveau_detail WHERE nom='Applicatif'")[0].n === 1);

  // diagramme : éléments + filtre + configuration (le rendu canvas reste à voir en vrai navigateur)
  const el = await w.eval(`(()=>{ const e=buildCyElements(); return e.nodes.map(n=>n.data.nom+':'+n.data.niveau); })()`);
  check('diagramme : chaque nœud porte son niveau', el.includes('Obj A:Applicatif') && el.includes('Obj D:— sans niveau'), el.join(','));
  check('diagramme : niveaux du filtre dans l\'ordre de création', await w.eval(`JSON.stringify(cyNiveaux)`) === JSON.stringify(['Métier','Applicatif','— sans niveau']));

  console.log(failures ? failures + ' échec(s)' : 'Tout est OK');
  process.exit(failures ? 1 : 0);
})();
