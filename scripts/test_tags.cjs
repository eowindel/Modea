// Teste les tags des objets (issue #32) : saisie, liste filtrée, duplication, référentiel, configurations
// du diagramme, migration v10 -> v11 et fusion à trois versions, avec les vraies fonctions de
// modea-editeur.html dans jsdom.
// Usage : node scripts/test_tags.cjs      Dépendance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (!ok && detail ? ' -- ' + detail : ''));
  if (!ok) failures++;
};
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modea-tag-'));
  const moto = path.join(tmp, 'moto.db');
  cp.execFileSync('python3', [path.join(root, 'scripts', 'generate_sample_moto_db.py'), moto]);
  const w = new JSDOM(fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8'),
    { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: new VirtualConsole() }).window;
  await new Promise(r => setTimeout(r, 500));
  const q = sql => w.eval(`exec(${JSON.stringify(sql)})`);
  const $ = id => w.document.getElementById(id);
  w.confirm = () => true;
  w.__b = new Uint8Array(fs.readFileSync(moto));
  await w.eval(`openBytes(__b,'moto.db')`);

  const set = (id, val) => { $(id).value = val; };
  const entree = () => $('o_tag').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  const tags = nom => q(`SELECT t.nom n FROM objet_tag ot JOIN tag t ON t.id=ot.tag_id JOIN objet o ON o.id=ot.objet_id WHERE o.nom='${nom}' ORDER BY t.nom`).map(r => r.n).join();
  const oid = nom => q(`SELECT id FROM objet WHERE nom='${nom}'`)[0].id;

  // saisie : Entrée ajoute une puce, la virgule sépare, le texte restant est pris à la validation
  set('o_nom', 'Obj A'); set('o_tag', 'Urgent'); entree();
  check('saisie : Entrée ajoute le tag sans créer l\'objet', $('o_tags').textContent.includes('Urgent') && !q("SELECT 1 n FROM objet WHERE nom='Obj A'").length);
  set('o_tag', 'Projet X, '); $('o_tag').dispatchEvent(new w.Event('input'));
  set('o_tag', 'brouillon projet'); w.eval('addOrUpdateObjet()');
  check('saisie : trois tags enregistrés', tags('Obj A') === 'Projet X,Urgent,brouillon projet', tags('Obj A'));
  check('saisie : fiche remise à zéro', $('o_tags').textContent === '' && $('o_tag').value === '');
  set('o_nom', 'Obj B'); set('o_tag', 'urgent, URGENT'); w.eval('addOrUpdateObjet()');
  check('saisie : casse différente = même tag', tags('Obj B') === 'Urgent' && q('SELECT COUNT(*) n FROM tag')[0].n === 3);
  set('o_nom', 'Obj C'); w.eval('addOrUpdateObjet()');
  set('o_nom', 'Obj D'); set('o_tag', 'Éco'); w.eval('addOrUpdateObjet()');
  set('o_nom', 'Obj E'); set('o_tag', 'éco'); w.eval('addOrUpdateObjet()');
  check('saisie : casse accentuée = même tag', tags('Obj E') === 'Éco');

  // modification : retrait par la croix, les liens conservés gardent leur identifiant
  const lien = () => q(`SELECT ot.uid u FROM objet_tag ot JOIN tag t ON t.id=ot.tag_id WHERE t.nom='Urgent' AND ot.objet_id=${oid('Obj A')}`)[0].u;
  const avant = lien();
  w.eval(`editObjetRow(${oid('Obj A')})`);
  check('édition : tags rechargés', $('o_tags').querySelectorAll('.tagchip').length === 3);
  check('édition : suggestions sans les tags déjà posés', [...w.document.querySelectorAll('#dl_tag option')].map(o => o.value).join() === 'Éco');
  [...$('o_tags').querySelectorAll('.tagchip')].find(c => c.textContent.startsWith('Projet X')).querySelector('button').click();
  w.eval('addOrUpdateObjet()');
  check('édition : tag retiré', tags('Obj A') === 'Urgent,brouillon projet', tags('Obj A'));
  check('édition : lien conservé inchangé', lien() === avant);
  w.eval(`editObjetRow(${oid('Obj A')})`); $('cancelObjetEdit').click();
  check('annulation : fiche vidée', $('o_tags').textContent === '');

  // liste filtrée
  const noms = () => [...w.document.querySelectorAll('#mgObjBody .mgname')].map(e => e.textContent);
  w.eval('refreshAll()');
  const opts = [...w.document.querySelectorAll('#mgObjTag option')].map(o => o.value);
  check('filtre de la liste : tags utilisés + « sans tag »', opts.join('|') === '|brouillon projet|Éco|Urgent|— sans tag', opts.join('|'));
  set('mgObjTag', 'Urgent'); w.eval('renderMgObjets()');
  check('filtre de la liste : un tag, sans doublon de ligne', noms().sort().join() === 'Obj A,Obj B', noms().join());
  set('mgObjTag', '— sans tag'); w.eval('renderMgObjets()');
  check('filtre de la liste : sans tag', noms().includes('Obj C') && !noms().includes('Obj A'));
  set('mgObjTag', ''); w.eval('renderMgObjets()');

  // duplication et suppression
  w.prompt = () => 'Obj A bis'; w.eval(`duplicateObjet(${oid('Obj A')})`);
  check('duplication : tags recopiés', tags('Obj A bis') === 'Urgent,brouillon projet');
  const bis = oid('Obj A bis'); w.eval(`deleteObjet(${bis})`);
  check('suppression d\'un objet : ses liens de tags partent', q(`SELECT COUNT(*) n FROM objet_tag WHERE objet_id=${bis}`)[0].n === 0);

  // référentiel
  check('référentiel : tags listés', $('ref_tag_body').textContent.includes('Projet X'));
  w.eval(`deleteRefRow('tag', ${q("SELECT id FROM tag WHERE nom='Urgent'")[0].id})`);
  check('référentiel : suppression refusée si utilisé', q("SELECT 1 n FROM tag WHERE nom='Urgent'").length === 1);
  w.eval('cleanUnusedRef()');
  check('nettoyage : seul le tag libre part', q('SELECT COUNT(*) n FROM tag')[0].n === 3 && !q("SELECT 1 n FROM tag WHERE nom='Projet X'").length);

  // diagramme : éléments (le rendu canvas reste à voir en vrai navigateur)
  const el = w.eval(`JSON.stringify(buildCyElements().nodes.filter(n=>/^Obj [AC]$/.test(n.data.nom)).map(n=>[n.data.nom,n.data.tags]))`);
  check('diagramme : chaque nœud porte ses tags', el === JSON.stringify([['Obj A', ['brouillon projet', 'Urgent']], ['Obj C', ['— sans tag']]]), el);

  // configurations : tout coché = pas de filtre ; sinon la sélection est retenue
  w.eval('renderCyLegendFilters()');
  set('cyFilterConfigName', 'tout'); w.eval('saveCurrentFilterConfig()');
  check('configuration : tout coché enregistré sans filtre', q("SELECT tags FROM filtre_diagramme WHERE nom='tout'")[0].tags === null);
  w.document.querySelectorAll('#cyFilterTag input').forEach(i => { i.checked = i.dataset.tag === 'Urgent'; });
  set('cyFilterConfigName', 'urgents'); w.eval('saveCurrentFilterConfig()');
  const cfg = q("SELECT id,tags FROM filtre_diagramme WHERE nom='urgents'")[0];
  check('configuration : sélection enregistrée', cfg.tags === '["Urgent"]', cfg.tags);
  w.document.querySelectorAll('#cyFilterTag input').forEach(i => { i.checked = true; });
  w.eval(`applyFilterConfig(${cfg.id}, true)`);
  check('configuration : sélection rétablie', [...w.document.querySelectorAll('#cyFilterTag input:checked')].map(i => i.dataset.tag).join() === 'Urgent');

  // fusion : le même tag créé et posé des deux côtés est unifié ; des tags différents s'additionnent
  const r = w.eval(`(()=>{ const base=exportDb();
    const poser=(d,o,t)=>{ d.run("INSERT OR IGNORE INTO tag(nom) VALUES (?)",[t]);
      d.run("INSERT INTO objet_tag(objet_id,tag_id) SELECT o.id,t.id FROM objet o, tag t WHERE o.nom=? AND t.nom=?",[o,t]); };
    const mine=new SQL.Database(base), theirs=new SQL.Database(base);
    poser(mine,'Obj C','Commun'); poser(theirs,'Obj C','Commun'); poser(mine,'Obj C','Mien'); poser(theirs,'Obj C','Sien');
    const m=mergeModels(base,mine,theirs.export(),null,'Bob');
    const noms=m.db ? m.db.exec("SELECT t.nom FROM objet_tag ot JOIN tag t ON t.id=ot.tag_id JOIN objet o ON o.id=ot.objet_id WHERE o.nom='Obj C' ORDER BY t.nom")[0].values.flat() : [];
    return JSON.stringify({c:m.conflicts.length, w:m.warnings, noms, resume:glChanges(base,mine)}); })()`);
  const m = JSON.parse(r);
  check('fusion : sans conflit ni perte', m.c === 0 && !m.w.length && m.noms.join() === 'Commun,Mien,Sien', r);
  check('résumé des modifications : tags mentionnés', m.resume.join().includes('2 tags ajoutés') && m.resume.join().includes('2 tags d’objet ajoutés'), m.resume.join());

  // migration v10 -> v11
  w.__b = new Uint8Array(fs.readFileSync(moto));
  await w.eval(`(async()=>{ await ensureSql(); const d=new SQL.Database(__b);
    d.run("DROP TABLE objet_tag"); d.run("DROP TABLE tag"); d.run("ALTER TABLE filtre_diagramme DROP COLUMN tags"); d.run("PRAGMA user_version=10");
    await openBytes(d.export(),'v10.db'); d.close(); })()`);
  check('migration v10 -> v11 : version, tables, colonne',
    q('PRAGMA user_version')[0].user_version === 11
    && q("SELECT 1 n FROM pragma_table_info('objet_tag') WHERE name='uid'").length === 1
    && q("SELECT 1 n FROM pragma_table_info('tag') WHERE name='uid'").length === 1
    && q("SELECT 1 n FROM pragma_table_info('filtre_diagramme') WHERE name='tags'").length === 1);
  set('o_nom', 'Après migration'); set('o_tag', 'ok'); w.eval('addOrUpdateObjet()');
  check('migration : saisie d\'un tag possible', tags('Après migration') === 'ok' && q('SELECT uid FROM objet_tag')[0].uid.length === 32);

  console.log(failures ? failures + ' échec(s)' : 'Tout est OK');
  process.exit(failures ? 1 : 0);
})();
