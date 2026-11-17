// Teste l'enregistrement dans GitLab et le travail à deux, avec les vraies fonctions de
// modea-editeur.html (jsdom) et un faux serveur GitLab en mémoire (API REST v4 simplifiée,
// dont le refus d'un commit basé sur une version dépassée : last_commit_id).
// Deux « postes » (Alice, Bruno) partagent le même dépôt.
// Usage : node scripts/test_gitlab.cjs       Dépendance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const quiet = new VirtualConsole(); // la navigation (téléchargements) n'existe pas dans jsdom : messages ignorés
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8');

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (!ok && detail ? ' -- ' + detail : ''));
  if (!ok) failures++;
};

/* ---------- faux GitLab ---------- */
function fakeGitlab() {
  const users = { tokA: 'Alice', tokB: 'Bruno' };
  const commits = []; // du plus ancien au plus récent : { id, short_id, title, author_name, committed_date, files:{path:base64} }
  const tags = [];
  let n = 0, beforeCommit = null;
  const state = ref => { // fichiers à une branche (main) ou un commit
    const i = ref === 'main' ? commits.length - 1 : commits.findIndex(c => c.id === ref);
    return i < 0 ? null : { files: commits[i].files, upto: commits.slice(0, i + 1) };
  };
  const lastTouch = (upto, p) => [...upto].reverse().find(c => c.touched.includes(p));
  const res = (status, body) => ({ ok: status < 300, status, json: async () => body, arrayBuffer: async () => new ArrayBuffer(0) });
  const pub = c => ({ id: c.id, short_id: c.short_id, title: c.title, message: c.title, author_name: c.author_name, committed_date: c.committed_date });
  async function fetch(url, opts = {}) {
    const u = new URL(url); const tok = (opts.headers || {})['PRIVATE-TOKEN'];
    if (!users[tok]) return res(401, { message: '401 Unauthorized' });
    const p = decodeURIComponent(u.pathname.replace(/^\/api\/v4\/projects\/[^/]+/, ''));
    const q = Object.fromEntries(u.searchParams);
    const m = opts.method || 'GET';
    if (m === 'GET' && p === '') return res(200, { id: 1, name_with_namespace: 'Atelier / Modèles', default_branch: 'main',
      empty_repo: !commits.length, permissions: { project_access: { access_level: 30 } } });
    if (m === 'GET' && p.startsWith('/repository/branches/')) return commits.length ? res(200, { name: 'main' }) : res(404, { message: '404 Branch Not Found' });
    if (m === 'GET' && p.startsWith('/repository/files/')) {
      const fp = p.slice('/repository/files/'.length); const st = state(q.ref);
      if (!st || !(fp in st.files)) return res(404, { message: '404 File Not Found' });
      return res(200, { file_path: fp, encoding: 'base64', content: st.files[fp], last_commit_id: lastTouch(st.upto, fp).id });
    }
    if (m === 'GET' && p === '/repository/commits') {
      const st = state(q.ref_name); if (!st) return res(200, []);
      return res(200, [...st.upto].reverse().filter(c => !q.path || c.touched.includes(q.path)).slice(0, +q.per_page || 20).map(pub));
    }
    if (m === 'POST' && p === '/repository/commits') {
      if (beforeCommit) { const f = beforeCommit; beforeCommit = null; await f(); }
      const b = JSON.parse(opts.body); const cur = state('main') || { files: {}, upto: [] };
      const files = { ...cur.files };
      for (const a of b.actions) {
        const exists = a.file_path in files;
        if (a.action === 'create' && exists) return res(400, { message: 'A file with this name already exists' });
        if (a.action === 'update' && !exists) return res(400, { message: "A file with this name doesn't exist" });
        if (a.action === 'update' && a.last_commit_id && lastTouch(cur.upto, a.file_path).id !== a.last_commit_id)
          return res(400, { message: 'You are attempting to update a file that has changed since you started editing it.' });
        files[a.file_path] = a.encoding === 'base64' ? a.content : Buffer.from(a.content, 'utf8').toString('base64');
      }
      const id = (++n).toString(16).padStart(40, '0');
      const c = { id, short_id: id.slice(-8), title: b.commit_message, author_name: users[tok],
        committed_date: new Date(Date.UTC(2026, 10, 17, 9, n)).toISOString(), files, touched: b.actions.map(a => a.file_path) };
      commits.push(c); return res(201, pub(c));
    }
    if (m === 'GET' && p === '/repository/tags') return res(200, tags);
    if (m === 'POST' && p === '/repository/tags') {
      const b = JSON.parse(opts.body);
      if (tags.some(t => t.name === b.tag_name)) return res(400, { message: 'Tag ' + b.tag_name + ' already exists' });
      tags.push({ name: b.tag_name, commit: { id: b.ref } }); return res(201, tags.at(-1));
    }
    return res(404, { message: 'route inconnue ' + m + ' ' + p });
  }
  return { fetch, commits, tags, set beforeCommit(f) { beforeCommit = f; }, text: (ref, fp) => Buffer.from(state(ref).files[fp], 'base64') };
}

/* ---------- un poste = une instance de l'éditeur ---------- */
let CUR = null; // dépôt GitLab courant (faux)
const CFG = { base_url: 'https://gitlab.test', project: 'atelier/modeles', branch: 'main', path: 'modeles/moto.db' };
async function poste(server, token) {
  const w = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: quiet }).window;
  w.fetch = (...a) => CUR.fetch(...a); w.confirm = () => true; w.HTMLAnchorElement.prototype.click = () => {};
  w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {};
  await new Promise(r => setTimeout(r, 500));
  w.localStorage.setItem('modea-gitlab-config', JSON.stringify(CFG));
  w.eval(`gl.token=${JSON.stringify(token)}`);
  const ev = s => w.eval(s);
  return { w, ev, n: sql => ev(`exec(${JSON.stringify(sql)})[0].n`), err: async s => {
    try { await ev(s); return null; } catch (e) { return e; } } };
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modea-gl-'));
  const moto = path.join(tmp, 'moto.db');
  cp.execFileSync('python3', [path.join(root, 'scripts', 'generate_sample_moto_db.py'), moto]);
  const S = CUR = fakeGitlab();
  const alice = await poste(S, 'tokA'), bruno = await poste(S, 'tokB');

  // 1) Alice publie son modèle local
  alice.w.__b = new Uint8Array(fs.readFileSync(moto));
  await alice.ev(`openBytes(__b,'moto.db')`);
  await alice.ev('glSave()');
  check('première publication : un commit', S.commits.length === 1, S.commits.length);
  check('message de première publication', S.commits[0]?.title === 'Modea : première publication de moto.db', S.commits[0]?.title);
  check('le commit contient le .db et le .sql', S.commits[0] && 'modeles/moto.db' in S.commits[0].files && 'modeles/moto.sql' in S.commits[0].files);
  const dump = S.text('main', 'modeles/moto.sql').toString('utf8');
  check('export texte lisible (INSERT par ligne, uid)', /INSERT INTO "objet" \("id", .*"uid"\) VALUES \(1, 'Moto'/.test(dump));
  check('Alice est reliée à GitLab', alice.ev('gl.link && gl.link.lastCommitId') === S.commits[0]?.id);
  check('bouton « Enregistrer dans GitLab »', alice.ev(`el('btnSave').textContent`) === 'Enregistrer dans GitLab');
  check('réglages GitLab écrits dans le modèle (sans jeton)',
    alice.n(`SELECT COUNT(*) n FROM meta WHERE key LIKE 'gitlab.%'`) === 4 && !alice.n(`SELECT COUNT(*) n FROM meta WHERE value LIKE 'tok%'`));
  check('sans modification : pas de commit', (await alice.ev('glSave()'), S.commits.length === 1));
  check('après un enregistrement, supprimer un objet supprime encore ses relations (clés étrangères actives)',
    alice.ev(`exec("PRAGMA foreign_keys")[0].foreign_keys`) === 1);

  // 2) Bruno ouvre depuis GitLab (aucun modèle ouvert)
  await bruno.ev('glOpen()');
  check('Bruno ouvre le modèle publié', bruno.n('SELECT COUNT(*) n FROM objet') === 34);
  check('Bruno part de la version d’Alice', bruno.ev('gl.link.lastCommitId') === S.commits[0].id);

  // 3) Alice ajoute un objet et enregistre : message résumé
  alice.ev(`run("INSERT INTO objet(nom,statut) VALUES ('Rétroviseur','brouillon')")`);
  await alice.ev('glSave()');
  check('résumé « 1 objet ajouté »', S.commits.at(-1).title === 'Modea : 1 objet ajouté', S.commits.at(-1).title);

  // Bruno arbitre les conflits selon __policy : 'mine' | 'theirs' | null (annuler) | { type: choix }
  bruno.ev(`glAskConflicts = async (c) => { __conf = c; const p = __policy; if (p === null) return null;
    return Object.fromEntries(c.map(x => { const k = x.id.split(':').pop(); return [x.id, typeof p === 'string' ? p : (p[k] || 'theirs')]; })); }`);
  bruno.w.__policy = 'theirs';

  // 4) Bruno est prévenu ; à l'enregistrement, son travail est fusionné avec celui d'Alice (sans question)
  bruno.ev(`run("UPDATE objet SET definition='modifié par Bruno' WHERE nom='Cadre'")`);
  await bruno.ev('glPoll()');
  check('Bruno voit la nouvelle version (bandeau)', !bruno.ev(`el('glBanner').classList.contains('hidden')`)
    && /Alice/.test(bruno.ev(`el('glBannerText').textContent`)));
  check('bandeau : « Intégrer ses modifications » quand on a du travail en cours', bruno.ev(`el('glBannerReload').textContent`) === 'Intégrer ses modifications');
  bruno.w.__conf = null;
  await bruno.ev('glSave()');
  check('fusion automatique, aucune question', bruno.ev('__conf') === null);
  check('message « fusionné avec la version de Alice »', S.commits.at(-1).title === 'Modea : 1 objet modifié — fusionné avec la version de Alice'
    && S.commits.at(-1).author_name === 'Bruno', S.commits.at(-1).title);
  check('le résultat contient le travail des deux', bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Rétroviseur'`) === 1
    && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Cadre' AND definition='modifié par Bruno'`) === 1);

  // 5) Course : Alice enregistre entre la vérification de Bruno et son commit -> GitLab refuse, Modea fusionne et réessaie
  bruno.ev(`run("UPDATE objet SET nom='Bloc moteur' WHERE nom='Moteur'")`);
  alice.ev(`run("DELETE FROM relation WHERE id=22")`);
  S.beforeCommit = () => alice.ev('glSave()');
  const nAvant = S.commits.length;
  await bruno.ev('glSave()');
  check('commit concurrent : refusé puis fusionné et enregistré', S.commits.length === nAvant + 2
    && S.commits.at(-2).author_name === 'Alice' && S.commits.at(-1).title === 'Modea : 1 objet modifié — fusionné avec la version de Alice',
    S.commits.slice(nAvant).map(c => c.author_name + ' : ' + c.title).join(' | '));
  check('rien n’est perdu (relation supprimée par Alice, renommage de Bruno)', bruno.n(`SELECT COUNT(*) n FROM relation WHERE id=22`) === 0
    && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Bloc moteur'`) === 1);

  // 6) « Intégrer ses modifications » : fusion sans enregistrer
  await alice.ev('glOpen()');
  alice.ev(`run("UPDATE objet SET statut='obsolete' WHERE nom='Fourche'")`);
  await alice.ev('glSave()');
  bruno.ev(`run("UPDATE objet SET definition='Selle biplace' WHERE nom='Selle'")`);
  const nPull = S.commits.length;
  await bruno.ev('glPull()');
  check('intégrer : pas de commit, travail en cours conservé', S.commits.length === nPull && bruno.ev('dirty') === true
    && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Selle' AND definition='Selle biplace'`) === 1);
  check('intégrer : les modifications d’Alice sont là', bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Fourche' AND statut='obsolete'`) === 1
    && bruno.ev('gl.link.lastCommitId') === S.commits.at(-1).id);
  await bruno.ev('glSave()');
  check('puis enregistrer : commit simple', S.commits.at(-1).title === 'Modea : 1 objet modifié', S.commits.at(-1).title);

  // 7) Historique, jalon, consultation, restauration
  await alice.ev('glOpen()');
  await alice.ev('glLoadHistory()');
  check('historique : 7 versions, la plus récente en tête', alice.ev('gl.history.commits.length') === 7
    && alice.ev('gl.history.commits[0].author_name') === 'Bruno', alice.ev('gl.history.commits.length'));
  alice.ev(`el('gl_tag').value='v1.0'`);
  await alice.ev('glTag()');
  check('jalon v1.0 posé sur la dernière version', S.tags[0]?.name === 'v1.0' && S.tags[0].commit.id === S.commits.at(-1).id);
  const e3 = await alice.err(`(el('gl_tag').value='v1.0', glTag())`);
  check('jalon en double refusé avec un message clair', e3 && /existe/.test(e3.message), e3 && e3.message);
  const first = S.commits[0].id;
  await alice.ev(`glView(${JSON.stringify(first)})`);
  check('consulter une version : ouverte sans lien GitLab', alice.n('SELECT COUNT(*) n FROM objet') === 34 && alice.ev('gl.link') === null);
  await alice.ev(`glRestore(${JSON.stringify(first)})`);
  const last = S.commits.at(-1);
  check('restauration = nouveau commit', /^Modea : restauration de la version du .*\(4 objets modifiés, 1 objet supprimé, 1 relation ajoutée\)$/.test(last.title), last.title);
  check('le modèle restauré est celui de la première version', alice.n(`SELECT COUNT(*) n FROM objet WHERE nom IN ('Rétroviseur','Bloc moteur')`) === 0
    && alice.ev('gl.link.lastCommitId') === last.id);

  // 7 bis) Scénarios de fusion : dépôt neuf, Alice et Bruno partent de la même version,
  // Alice enregistre d'abord, puis Bruno (qui fusionne)
  const q = (sql) => JSON.stringify(sql);
  async function scenario({ a = [], b = [], policy = 'theirs' }) {
    CUR = fakeGitlab();
    alice.w.__b = new Uint8Array(fs.readFileSync(moto)); await alice.ev(`openBytes(__b,'moto.db')`); await alice.ev('glSave()');
    await bruno.ev('glOpen()');
    for (const x of a) alice.ev(`run(${q(x)})`);
    await alice.ev('glSave()');
    for (const x of b) bruno.ev(`run(${q(x)})`);
    bruno.w.__policy = policy; bruno.w.__conf = null;
    const e = await bruno.err('glSave()');
    return { e, kinds: bruno.ev('__conf && __conf.map(c => c.id.split(":").pop())'), titles: bruno.ev('__conf && __conf.map(c => c.title)'),
      head: CUR.commits.at(-1), n: CUR.commits.length };
  }
  const OBJ = nom => `(SELECT id FROM objet WHERE nom='${nom}')`;

  // même champ modifié des deux côtés
  for (const [pol, attendu] of [['theirs', 'déf Alice'], ['mine', 'déf Bruno']]) {
    const r = await scenario({ a: [`UPDATE objet SET definition='déf Alice' WHERE nom='Moteur'`], b: [`UPDATE objet SET definition='déf Bruno' WHERE nom='Moteur'`], policy: pol });
    check(`même champ des deux côtés : 1 question, choix « ${pol} » appliqué`, JSON.stringify(r.kinds) === '["definition"]'
      && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Moteur' AND definition='${attendu}'`) === 1, JSON.stringify(r.kinds) + ' ' + (r.e && r.e.message));
  }
  // même objet, champs différents : pas de question
  { const r = await scenario({ a: [`UPDATE objet SET definition='déf Alice' WHERE nom='Moteur'`], b: [`UPDATE objet SET statut='obsolete' WHERE nom='Moteur'`] });
    check('même objet, champs différents : fusion sans question', r.kinds === null
      && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Moteur' AND definition='déf Alice' AND statut='obsolete'`) === 1); }
  // le même domaine créé des deux côtés : unifié sans question
  { const r = await scenario({
      a: [`INSERT INTO domaine(nom) VALUES ('Freinage')`, `INSERT INTO objet(nom,domaine_id) VALUES ('Plaquette',(SELECT id FROM domaine WHERE nom='Freinage'))`],
      b: [`INSERT INTO domaine(nom) VALUES ('Freinage')`, `INSERT INTO objet(nom,domaine_id) VALUES ('Mâchoire',(SELECT id FROM domaine WHERE nom='Freinage'))`] });
    check('domaine créé des deux côtés : unifié, sans question', r.kinds === null && bruno.n(`SELECT COUNT(*) n FROM domaine WHERE nom='Freinage'`) === 1
      && bruno.n(`SELECT COUNT(*) n FROM objet o JOIN domaine d ON d.id=o.domaine_id WHERE d.nom='Freinage'`) === 2, r.e && r.e.message); }
  // le même objet créé des deux côtés avec des valeurs différentes : question « doublon »
  { const r = await scenario({ a: [`INSERT INTO objet(nom,definition) VALUES ('Rétroviseur','version Alice')`],
      b: [`INSERT INTO objet(nom,definition) VALUES ('Rétroviseur','version Bruno')`], policy: 'mine' });
    check('objet créé des deux côtés, différent : question « doublon », un seul objet gardé', JSON.stringify(r.kinds) === '["doublon"]'
      && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Rétroviseur'`) === 1 && bruno.n(`SELECT COUNT(*) n FROM objet WHERE definition='version Bruno'`) === 1,
      JSON.stringify(r.kinds)); }
  // modifié chez Bruno, supprimé chez Alice
  for (const [pol, garde] of [['theirs', 0], ['mine', 1]]) {
    const r = await scenario({ a: [`DELETE FROM objet WHERE nom='Carénage'`], b: [`UPDATE objet SET definition='carénage sport' WHERE nom='Carénage'`], policy: pol });
    check(`modifié / supprimé : question, choix « ${pol} »`, JSON.stringify(r.kinds) === '["modsuppr"]'
      && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Carénage'`) === garde, JSON.stringify(r.kinds) + ' ' + (r.e && r.e.message));
    if (garde) check('carénage rétabli avec sa relation « Carrosserie contient Carénage »',
      bruno.n(`SELECT COUNT(*) n FROM relation WHERE cible_id=${OBJ('Carénage')}`) === 1,
      bruno.n(`SELECT COUNT(*) n FROM relation WHERE cible_id=${OBJ('Carénage')}`) + ' / ' + bruno.ev('JSON.stringify(gl.lastMerge)'));
  }
  // supprimé chez Bruno, alors qu'Alice l'utilise (nouvelle relation)
  for (const [pol, garde] of [['theirs', 1], ['mine', 0]]) {
    const r = await scenario({
      a: [`INSERT INTO relation(type,source_id,cible_id) VALUES ('association',${OBJ('Phare')},${OBJ('Batterie')})`],
      b: [`DELETE FROM objet WHERE nom='Batterie'`], policy: pol });
    check(`supprimé alors que l’autre l’utilise : question, choix « ${pol} »`, JSON.stringify(r.kinds) === '["suppr"]'
      && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Batterie'`) === garde
      && bruno.n(`SELECT COUNT(*) n FROM relation WHERE source_id=${OBJ('Phare')} AND cible_id=${OBJ('Batterie')}`) === garde, JSON.stringify(r.kinds));
    if (garde) check('batterie gardée avec ses 2 affectations et ses relations (pas de cascade)',
      bruno.n(`SELECT COUNT(*) n FROM applicabilite WHERE objet_id=${OBJ('Batterie')}`) === 2
      && bruno.n(`SELECT COUNT(*) n FROM relation WHERE cible_id=${OBJ('Batterie')}`) === 3,
      bruno.n(`SELECT COUNT(*) n FROM applicabilite WHERE objet_id=${OBJ('Batterie')}`) + ' affectations, ' + bruno.n(`SELECT COUNT(*) n FROM relation WHERE cible_id=${OBJ('Batterie')}`) + ' relations');
  }
  // Bruno utilise un objet qu'Alice a supprimé
  for (const [pol, garde] of [['mine', 1], ['theirs', 0]]) {
    const r = await scenario({ a: [`DELETE FROM objet WHERE nom='Selle'`],
      b: [`INSERT INTO applicabilite(objet_id,propriete_id) SELECT ${OBJ('Selle')}, id FROM propriete WHERE id NOT IN (SELECT propriete_id FROM applicabilite WHERE objet_id=${OBJ('Selle')}) LIMIT 1`],
      policy: pol });
    check(`utilise un élément supprimé par l’autre : question, choix « ${pol} »`, JSON.stringify(r.kinds) === '["restaure"]'
      && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Selle'`) === garde && !r.e, JSON.stringify(r.kinds) + ' ' + (r.e && r.e.message));
    if (garde) check('selle rétablie avec sa relation « Carrosserie contient Selle »', bruno.n(`SELECT COUNT(*) n FROM relation WHERE cible_id=${OBJ('Selle')}`) === 1);
  }
  // annuler l'arbitrage : rien n'est enregistré, le travail reste ouvert
  { const r = await scenario({ a: [`UPDATE objet SET definition='déf Alice' WHERE nom='Moteur'`], b: [`UPDATE objet SET definition='déf Bruno' WHERE nom='Moteur'`], policy: null });
    check('arbitrage annulé : rien enregistré, travail intact', r.e && /annulée/.test(r.e.message) && r.n === 2 && r.head.author_name === 'Alice'
      && bruno.ev('dirty') === true && bruno.n(`SELECT COUNT(*) n FROM objet WHERE definition='déf Bruno'`) === 1, r.e && r.e.message); }
  // libellés des questions lisibles
  { const r = await scenario({ a: [`UPDATE objet SET statut='obsolete' WHERE nom='Moteur'`], b: [`UPDATE objet SET statut='brouillon' WHERE nom='Moteur'`], policy: 'mine' });
    check('libellé de question lisible', r.titles && r.titles[0] === 'objet « Moteur », statut : modifications différentes des deux côtés', r.titles && r.titles[0]); }
  // la version enregistrée après fusion se rouvre telle quelle chez Alice
  { await alice.ev('glOpen()');
    check('Alice rouvre la version fusionnée', alice.n(`SELECT COUNT(*) n FROM objet WHERE nom='Moteur' AND statut='brouillon'`) === 1
      && alice.ev('gl.link.lastCommitId') === CUR.commits.at(-1).id); }

  // 8) Publier un modèle local par-dessus un modèle existant : refusé
  alice.w.__b = new Uint8Array(fs.readFileSync(moto));
  await alice.ev(`openBytes(__b,'moto.db')`);
  const e4 = await alice.err('glSave()');
  check('publier par-dessus un modèle existant : refusé', e4 && /existe déjà/.test(e4.message), e4 && e4.message);

  // 9) Migration v6 -> v7 : uid déterministes, identiques sur les deux postes
  const v6 = path.join(tmp, 'v6.db');
  fs.writeFileSync(path.join(tmp, 'v6.sql'), cp.execFileSync('git', ['-C', root, 'show', 'main:metamodele.sql']));
  cp.execFileSync('python3', ['-c', `
import sqlite3,sys
c=sqlite3.connect(sys.argv[1]); c.executescript(open(sys.argv[2],encoding='utf-8').read())
c.executemany("INSERT INTO objet(nom) VALUES (?)", [('Produit',),('Pièce',),('Document',)]); c.commit()`, v6, path.join(tmp, 'v6.sql')]);
  for (const p of [alice, bruno]) { p.w.__b = new Uint8Array(fs.readFileSync(v6)); await p.ev(`openBytes(__b,'v6.db')`); }
  const uids = p => JSON.stringify(p.ev(`exec("SELECT uid FROM objet ORDER BY id").map(r=>r.uid)`));
  check('base v6 migrée en v7', alice.ev(`exec("PRAGMA user_version")[0].user_version`) === 7);
  check('uid de migration déterministes (mêmes sur les deux postes)', uids(alice) === uids(bruno) && /"objet-1"/.test(uids(alice)), uids(alice));
  alice.ev(`run("INSERT INTO objet(nom) VALUES ('Nouveau')")`);
  check('nouvel élément : uid aléatoire', /^[0-9a-f]{32}$/.test(alice.ev(`exec("SELECT uid FROM objet WHERE nom='Nouveau'")[0].uid`)));

  // 9 bis) Modèle abîmé dans GitLab (enregistré avant la v0.6.7 : orphelins après suppression d'un objet)
  {
    CUR = fakeGitlab();
    alice.w.__b = new Uint8Array(fs.readFileSync(moto));
    await alice.ev(`openBytes(__b,'moto.db')`); await alice.ev('glSave()');
    await alice.ev(`(async()=>{ // Batterie supprimée sans cascade : 2 affectations et 2 relations orphelines
      const T=new SQL.Database(exportDb()); T.run("PRAGMA foreign_keys=OFF"); T.run("DELETE FROM objet WHERE nom='Batterie'");
      await glClientOrError(glConfig()).commit({ branch:'main', commit_message:'ancienne version', actions:[
        { action:'update', file_path:'modeles/moto.db', encoding:'base64', content:bytesToBase64(T.export()) }] }); })()`);
    const orphans = p => p.n(`SELECT COUNT(*) n FROM pragma_foreign_key_check`);
    await bruno.ev('glOpen()');
    check('modèle abîmé ouvert depuis GitLab : réparé et à enregistrer', orphans(bruno) === 0 && bruno.ev('dirty') === true);
    await bruno.ev('glSave()');
    check('la réparation est publiée avec son résumé', CUR.commits.at(-1).title === 'Modea : 2 affectations supprimées, 2 relations supprimées', CUR.commits.at(-1).title);
    // Alice travaillait encore sur la version abîmée : sa fusion avec la version réparée reste propre
    await alice.ev(`(async()=>{ const T=new SQL.Database(base64ToBytes((await glClientOrError(glConfig()).file('modeles/moto.db','main')).content));
      T.run("PRAGMA foreign_keys=OFF"); T.run("DELETE FROM objet WHERE nom='Batterie'"); db=T; db.run("PRAGMA foreign_keys=ON");
      gl.link.lastCommitId=CUR_PREV; gl.baseBytes=exportDb(); })()`.replace('CUR_PREV', JSON.stringify(CUR.commits.at(-2).id)));
    alice.ev(`run("UPDATE objet SET definition='Moteur révisé' WHERE nom='Moteur'")`);
    const e5 = await alice.err('glSave()');
    check('fusion avec une version abîmée : pas d’orphelin réintroduit', !e5 && orphans(alice) === 0
      && CUR.commits.at(-1).title === 'Modea : 1 objet modifié — fusionné avec la version de Bruno', e5 ? e5.message : CUR.commits.at(-1).title);
    // l'autre version contient des orphelins : le résultat de la fusion n'en contient pas
    const r6 = alice.ev(`(()=>{ const base=exportDb(); const T=new SQL.Database(base); T.run("PRAGMA foreign_keys=OFF");
      T.run("DELETE FROM objet WHERE nom='Phare'"); T.run("DELETE FROM objet WHERE nom='Selle'");
      run("UPDATE objet SET statut='brouillon' WHERE nom='Moteur'");
      const r=mergeModels(base, db, T.export(), null, 'Bruno');
      return JSON.stringify({c:r.conflicts.length, o:r.db.exec("SELECT COUNT(*) FROM pragma_foreign_key_check")[0].values[0][0]}); })()`);
    check('fusion : les orphelins de l’autre version sont nettoyés', r6 === '{"c":0,"o":0}', r6);
  }

  // 10) Base neuve de l'éditeur = metamodele.sql (même structure)
  await alice.ev('newModel()');
  const struct = alice.ev(`JSON.stringify(exec("SELECT m.type,m.name,(SELECT group_concat(name) FROM pragma_table_info(m.name)) cols FROM sqlite_master m WHERE m.name NOT LIKE 'sqlite_%' ORDER BY m.type,m.name"))`);
  const py = cp.execFileSync('python3', ['-c', `
import sqlite3,json
c=sqlite3.connect(':memory:'); c.executescript(open(${JSON.stringify(path.join(root, 'metamodele.sql'))},encoding='utf-8').read())
print(json.dumps([dict(type=t,name=n,cols=cols) for t,n,cols in c.execute("SELECT m.type,m.name,(SELECT group_concat(name) FROM pragma_table_info(m.name)) cols FROM sqlite_master m WHERE m.name NOT LIKE 'sqlite_%' ORDER BY m.type,m.name")]))`]).toString();
  const a = JSON.parse(struct).filter(x => !x.name.startsWith('saisie_') && !/^trg_saisie/.test(x.name));
  const b = JSON.parse(py);
  check('base neuve de l’éditeur = metamodele.sql (tables, index, triggers, colonnes)', JSON.stringify(a) === JSON.stringify(b),
    JSON.stringify(a.filter(x => !b.some(y => JSON.stringify(y) === JSON.stringify(x)))).slice(0, 300));

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${failures ? 'ECHEC' : 'OK'} : ${failures} test(s) en echec`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
