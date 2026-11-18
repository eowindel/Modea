// Teste l'enregistrement dans GitHub (github.com) et le travail à deux, avec les vraies fonctions de
// modea-editeur.html (jsdom) et un faux GitHub en mémoire : API REST (dépôt, branches, contenu brut,
// commits filtrés par fichier, tags) et API Git (blobs, arbres, commits, déplacement de branche refusé
// s'il n'est pas en avance rapide). La fusion elle-même est couverte par test_gitlab.cjs (code commun).
// Usage : node scripts/test_github.cjs       Dépendance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), crypto = require('crypto');
const { JSDOM, VirtualConsole } = require('jsdom');
const quiet = new VirtualConsole();
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8');

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (!ok && detail ? ' -- ' + detail : ''));
  if (!ok) failures++;
};

/* ---------- faux GitHub ---------- */
function fakeGithub({ empty = false } = {}) {
  const users = { tokA: 'Alice', tokB: 'Bruno', tokC: 'Claire' };
  const blobs = {}, trees = {}, commits = {}, refs = {}; // refs : 'heads/main' | 'tags/v1' -> sha
  const order = []; // shas des commits, dans l'ordre de création
  let n = 0, beforePatch = null;
  const sha = s => crypto.createHash('sha1').update(s + (++n)).digest('hex');
  const mk = (files, message, author, parents) => {
    const t = sha('t'); trees[t] = { ...files };
    const c = sha('c'); commits[c] = { sha: c, tree: t, message, parents, author: { name: author, date: new Date(Date.UTC(2026, 10, 18, 9, n)).toISOString() } };
    order.push(c); return c;
  };
  if (!empty) { const b = sha('b'); blobs[b] = Buffer.from('# modeles\n'); refs['heads/main'] = mk({ 'README.md': b }, 'Initial commit', 'Alice', []); }
  const resolve = ref => refs['heads/' + ref] || (commits[ref] ? ref : null);
  const history = start => { const out = []; let c = start; while (c) { out.push(c); c = commits[c].parents[0]; } return out; };
  const touched = (c, p) => { const par = commits[c].parents[0]; return trees[commits[c].tree][p] !== (par ? trees[commits[par].tree][p] : undefined); };
  const isAncestor = (a, b) => history(b).includes(a);
  const res = (status, body, raw) => ({ ok: status < 300, status, json: async () => body,
    arrayBuffer: async () => { const b = raw || Buffer.alloc(0); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); } });
  const pubCommit = c => ({ sha: c.sha, commit: { message: c.message, author: c.author, committer: { date: c.author.date } } });
  const calls = [];
  async function fetch(url, opts = {}) {
    const u = new URL(url); const h = opts.headers || {};
    const tok = (h.Authorization || '').replace(/^Bearer /, '');
    if (u.origin !== 'https://api.github.com') return res(404, { message: 'mauvaise adresse ' + u.origin });
    if (!users[tok]) return res(401, { message: 'Bad credentials' });
    const m = opts.method || 'GET'; const q = Object.fromEntries(u.searchParams);
    const b = opts.body ? JSON.parse(opts.body) : null;
    const mm = u.pathname.match(/^\/repos\/equipe\/modeles(\/.*)?$/);
    calls.push(m + ' ' + u.pathname);
    if (!mm) return res(404, { message: 'Not Found' });
    const p = decodeURIComponent(mm[1] || '');
    const isEmpty = !Object.keys(refs).some(k => k.startsWith('heads/'));
    if (m === 'GET' && p === '') return res(200, { full_name: 'equipe/modeles', default_branch: 'main', size: isEmpty ? 0 : 12, permissions: { admin: false, push: true, pull: true } });
    if (m === 'GET' && p.startsWith('/branches/')) { const r = refs['heads/' + p.slice(10)]; return r ? res(200, { name: p.slice(10), commit: { sha: r } }) : res(404, { message: 'Branch not found' }); }
    if (m === 'GET' && p.startsWith('/contents/')) {
      if (isEmpty) return res(404, { message: 'This repository is empty.' });
      const c = resolve(q.ref || 'main'); const fp = p.slice(10);
      const bl = c && trees[commits[c].tree][fp];
      if (!bl) return res(404, { message: 'Not Found' });
      if (!/raw/.test(h.Accept || '')) return res(200, { content: blobs[bl].toString('base64'), encoding: 'base64', size: blobs[bl].length });
      return res(200, null, blobs[bl]);
    }
    if (m === 'GET' && p === '/commits') {
      if (isEmpty) return res(409, { message: 'Git Repository is empty.' });
      const c = resolve(q.sha || 'main'); if (!c) return res(404, { message: 'No commit found for SHA: ' + q.sha });
      return res(200, history(c).filter(x => !q.path || touched(x, q.path)).slice(0, +q.per_page || 30).map(x => pubCommit(commits[x])));
    }
    if (m === 'GET' && p.startsWith('/git/ref/heads/')) {
      if (isEmpty) return res(409, { message: 'Git Repository is empty.' });
      const r = refs['heads/' + p.slice(15)]; return r ? res(200, { object: { sha: r } }) : res(404, { message: 'Not Found' });
    }
    if (m === 'GET' && p.startsWith('/git/commits/')) { const c = commits[p.slice(13)]; return c ? res(200, { sha: c.sha, tree: { sha: c.tree } }) : res(404, {}); }
    if (m === 'POST' && p === '/git/blobs') { const s = sha('b'); blobs[s] = Buffer.from(b.content, b.encoding === 'base64' ? 'base64' : 'utf8'); return res(201, { sha: s }); }
    if (m === 'POST' && p === '/git/trees') {
      const files = { ...(trees[b.base_tree] || {}) }; for (const e of b.tree) files[e.path] = e.sha;
      const t = sha('t'); trees[t] = files; return res(201, { sha: t });
    }
    if (m === 'POST' && p === '/git/commits') {
      const c = sha('c'); commits[c] = { sha: c, tree: b.tree, message: b.message, parents: b.parents, author: { name: users[tok], date: new Date(Date.UTC(2026, 10, 18, 10, n)).toISOString() } };
      order.push(c); return res(201, { sha: c, message: b.message, author: commits[c].author, committer: { date: commits[c].author.date }, tree: { sha: b.tree } });
    }
    if (m === 'PATCH' && p.startsWith('/git/refs/heads/')) {
      if (beforePatch) { const f = beforePatch; beforePatch = null; await f(); }
      const k = 'heads/' + p.slice(16);
      if (!refs[k]) return res(422, { message: 'Reference does not exist' });
      if (!b.force && !isAncestor(refs[k], b.sha)) return res(422, { message: 'Update is not a fast forward' });
      refs[k] = b.sha; return res(200, { object: { sha: b.sha } });
    }
    if (m === 'POST' && p === '/git/refs') {
      const k = b.ref.replace(/^refs\//, ''); if (refs[k]) return res(422, { message: 'Reference already exists' });
      refs[k] = b.sha; return res(201, { ref: b.ref, object: { sha: b.sha } });
    }
    if (m === 'GET' && p === '/tags') return res(200, Object.keys(refs).filter(k => k.startsWith('tags/')).map(k => ({ name: k.slice(5), commit: { sha: refs[k] } })));
    return res(404, { message: 'route inconnue ' + m + ' ' + p });
  }
  const head = () => refs['heads/main'] && commits[refs['heads/main']];
  return { fetch, calls, refs, head, history: () => history(refs['heads/main']).map(c => commits[c]),
    file: (fp, ref = 'main') => { const c = resolve(ref); const bl = c && trees[commits[c].tree][fp]; return bl ? blobs[bl] : null; },
    // quelqu'un modifie un AUTRE fichier directement sur GitHub (ex : le README)
    pushOther: (fp, text, who = 'Claire') => { const par = refs['heads/main']; const bl = sha('b'); blobs[bl] = Buffer.from(text);
      refs['heads/main'] = mk({ ...trees[commits[par].tree], [fp]: bl }, 'Edit ' + fp, who, [par]); },
    set beforePatch(f) { beforePatch = f; } };
}

/* ---------- un poste = une instance de l'éditeur ---------- */
let CUR = null;
const CFG = { base_url: 'https://github.com', project: 'equipe/modeles', branch: 'main', path: 'modeles/moto.db' };
async function poste(token) {
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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modea-gh-'));
  const moto = path.join(tmp, 'moto.db');
  cp.execFileSync('python3', [path.join(root, 'scripts', 'generate_sample_moto_db.py'), moto]);
  const S = CUR = fakeGithub();
  const alice = await poste('tokA'), bruno = await poste('tokB');

  // 0) adresse collée, détection, test de connexion
  check('adresse GitHub collée : dépôt reconnu', JSON.stringify(alice.ev(`parseGitlabProjectUrl('https://github.com/equipe/modeles/tree/main/modeles')`))
    === JSON.stringify({ baseUrl: 'https://github.com', project: 'equipe/modeles' }));
  check('adresse GitLab collée : inchangé', JSON.stringify(alice.ev(`parseGitlabProjectUrl('https://gitlab.corp/groupe/projet/-/tree/main')`))
    === JSON.stringify({ baseUrl: 'https://gitlab.corp', project: 'groupe/projet' }));
  await alice.ev('glTest()');
  check('tester la connexion', /Connecté à equipe\/modeles — rôle Developer/.test(alice.ev('gl.status.text')), alice.ev('gl.status && gl.status.text'));

  // 1) Alice publie son modèle local
  alice.w.__b = new Uint8Array(fs.readFileSync(moto));
  await alice.ev(`openBytes(__b,'moto.db')`);
  await alice.ev('glSave()');
  check('première publication : un commit avec le .db et le .sql', S.head().message === 'Modea : première publication de moto.db'
    && S.file('modeles/moto.db') && S.file('modeles/moto.sql'), S.head().message);
  check('le README existant est conservé', S.file('README.md') && S.file('README.md').toString() === '# modeles\n');
  check('le .db publié est identique au modèle', Buffer.compare(S.file('modeles/moto.db'), Buffer.from(alice.ev('exportDb()'))) === 0);
  check('Alice est reliée à GitHub', alice.ev('gl.link && gl.link.lastCommitId') === S.head().sha);
  check('bouton « Enregistrer dans GitHub », pastille GitHub', alice.ev(`el('btnSave').textContent`) === 'Enregistrer dans GitHub'
    && /^GitHub · main/.test(alice.ev(`el('glChip').textContent`)));
  check('le jeton GitHub n’est pas envoyé ailleurs qu’à api.github.com', S.calls.every(c => c.includes('/repos/equipe/modeles')));

  // 2) Bruno ouvre depuis GitHub
  await bruno.ev('glOpen()');
  check('Bruno ouvre le modèle publié', bruno.n('SELECT COUNT(*) n FROM objet') === 34 && bruno.ev('gl.link.lastCommitId') === S.head().sha);

  // 3) enregistrements concurrents : fusion automatique
  alice.ev(`run("INSERT INTO objet(nom) VALUES ('Rétroviseur')")`); await alice.ev('glSave()');
  check('résumé « 1 objet ajouté », auteur Alice', S.head().message === 'Modea : 1 objet ajouté' && S.head().author.name === 'Alice', S.head().message);
  bruno.ev(`run("UPDATE objet SET definition='modifié par Bruno' WHERE nom='Cadre'")`);
  await bruno.ev('glPoll()');
  check('Bruno voit la nouvelle version (bandeau GitHub)', !bruno.ev(`el('glBanner').classList.contains('hidden')`)
    && /dans GitHub par Alice/.test(bruno.ev(`el('glBannerText').textContent`)));
  await bruno.ev('glSave()');
  check('fusion automatique à l’enregistrement', S.head().message === 'Modea : 1 objet modifié — fusionné avec la version de Alice'
    && S.head().author.name === 'Bruno', S.head().message);
  check('le résultat contient le travail des deux', bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Rétroviseur'`) === 1
    && bruno.n(`SELECT COUNT(*) n FROM objet WHERE definition='modifié par Bruno'`) === 1);

  // 4) course : Alice enregistre le modèle entre la vérification de Bruno et le déplacement de la branche
  await alice.ev('glOpen()');
  bruno.ev(`run("UPDATE objet SET nom='Bloc moteur' WHERE nom='Moteur'")`);
  alice.ev(`run("UPDATE objet SET statut='obsolete' WHERE nom='Fourche'")`);
  S.beforePatch = () => alice.ev('glSave()');
  await bruno.ev('glSave()');
  const h4 = S.history().slice(0, 2);
  check('course sur le modèle : refusé puis fusionné et enregistré', h4[1].author.name === 'Alice'
    && h4[0].message === 'Modea : 1 objet modifié — fusionné avec la version de Alice', h4.map(c => c.author.name + ' : ' + c.message).join(' | '));
  check('rien n’est perdu', bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Bloc moteur'`) === 1
    && bruno.n(`SELECT COUNT(*) n FROM objet WHERE nom='Fourche' AND statut='obsolete'`) === 1);

  // 5) quelqu'un modifie un autre fichier du dépôt pendant l'enregistrement : simple nouvel essai, pas de fusion
  bruno.ev(`run("UPDATE objet SET definition='Selle biplace' WHERE nom='Selle'")`);
  S.beforePatch = () => S.pushOther('README.md', '# modeles\nmodifié par Claire\n');
  await bruno.ev('glSave()');
  check('autre fichier modifié entre-temps : enregistré quand même, README conservé',
    S.head().message === 'Modea : 1 objet modifié' && S.file('README.md').toString().includes('Claire'), S.head().message);
  check('Bruno reste relié à sa version', bruno.ev('gl.link.lastCommitId') === S.head().sha && bruno.ev('dirty') === false);
  await bruno.ev('glPoll()');
  check('pas de bandeau pour une modification d’un autre fichier', bruno.ev(`el('glBanner').classList.contains('hidden')`));

  // 6) historique, jalon, consultation, restauration
  await alice.ev('glOpen()');
  await alice.ev('glLoadHistory()');
  check('historique : seulement les versions du modèle (pas le README)', alice.ev('gl.history.commits.length') === 6
    && alice.ev('gl.history.commits.every(c => /^Modea/.test(c.title))'), alice.ev('gl.history.commits.map(c=>c.title).join(" | ")'));
  alice.ev(`el('gl_tag').value='v1.0'`);
  await alice.ev('glTag()');
  check('jalon v1.0 posé sur la version enregistrée', S.refs['tags/v1.0'] === alice.ev('gl.link.lastCommitId'));
  await alice.ev('glLoadHistory()');
  check('le jalon apparaît dans l’historique', alice.ev(`(gl.history.byCommit.get(gl.link.lastCommitId)||[]).includes('v1.0')`));
  const e1 = await alice.err(`(el('gl_tag').value='v1.0', glTag())`);
  check('jalon en double refusé avec un message clair', e1 && /existe/.test(e1.message), e1 && e1.message);
  const first = S.history().filter(c => /première publication/.test(c.message))[0].sha;
  await alice.ev(`glView(${JSON.stringify(first)})`);
  check('consulter une version : ouverte sans lien', alice.n('SELECT COUNT(*) n FROM objet') === 34 && alice.ev('gl.link') === null);
  await alice.ev(`glRestore(${JSON.stringify(first)})`);
  check('restauration = nouveau commit', /^Modea : restauration de la version du /.test(S.head().message), S.head().message);
  check('le modèle restauré est celui de la première version', alice.n(`SELECT COUNT(*) n FROM objet WHERE nom IN ('Rétroviseur','Bloc moteur')`) === 0);

  // 7) publier par-dessus un modèle existant : refusé
  alice.w.__b = new Uint8Array(fs.readFileSync(moto)); await alice.ev(`openBytes(__b,'moto.db')`);
  const e2 = await alice.err('glSave()');
  check('publier par-dessus un modèle existant : refusé', e2 && /existe déjà/.test(e2.message), e2 && e2.message);

  // 8) nouvelle branche : créée à partir de la branche par défaut
  alice.ev(`glSetConfig('branch','revue'); glSetConfig('path','modeles/revue.db')`);
  const mainAvant = S.refs['heads/main'];
  const e3 = await alice.err('glSave()');
  check('nouvelle branche « revue » créée depuis main, main inchangée', !e3 && !!S.refs['heads/revue'] && S.refs['heads/main'] === mainAvant
    && S.file('modeles/revue.db', 'revue') && S.file('modeles/moto.db', 'revue'), e3 && e3.message);
  alice.ev(`glSetConfig('branch','main'); glSetConfig('path','modeles/moto.db')`);

  // 9) erreurs claires
  CUR = fakeGithub({ empty: true });
  alice.w.__b = new Uint8Array(fs.readFileSync(moto)); await alice.ev(`openBytes(__b,'moto.db')`);
  const e4 = await alice.err('glSave()');
  check('dépôt vide : message clair', e4 && /dépôt GitHub est vide/.test(e4.message), e4 && e4.message);
  CUR = fakeGithub();
  alice.ev(`gl.token='mauvais'`);
  const e5 = await alice.err('glTest()');
  check('jeton refusé : message clair', e5 && /Jeton refusé \(401\)/.test(e5.message), e5 && e5.message);
  alice.ev(`gl.token='tokA'; glSetConfig('project','equipe/inconnu')`);
  const e6 = await alice.err('glTest()');
  check('dépôt inaccessible : message clair', e6 && /Introuvable \(404\).*jeton/.test(e6.message), e6 && e6.message);
  alice.ev(`glSetConfig('project','equipe/modeles')`);

  // 10) GitLab inchangé : un serveur GitLab reçoit toujours l'API v4
  alice.ev(`glSetConfig('base_url','https://gitlab.test')`);
  let seen = null; alice.w.fetch = async (url) => { seen = url; return { ok: false, status: 401, json: async () => ({}) }; };
  await alice.err('glTest()');
  check('adresse GitLab : API v4 de GitLab appelée', seen && seen.startsWith('https://gitlab.test/api/v4/'), seen);
  alice.ev('glUpdateUI()');
  check('libellés GitLab conservés pour un dépôt GitLab', alice.ev('FG()') === 'GitLab');

  console.log('\n' + (failures ? 'ECHEC : ' : 'OK : ') + failures + ' test(s) en echec');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
