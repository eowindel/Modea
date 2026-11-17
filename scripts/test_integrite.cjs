// Teste l'intégrité référentielle de l'éditeur (vraies fonctions de modea-editeur.html, dans jsdom) :
// 1) après un enregistrement (export de la base), supprimer un objet supprime encore ses relations et
//    affectations (sql.js rouvre la base dans export() et perdait PRAGMA foreign_keys) ;
// 2) un modèle déjà abîmé par ce défaut est réparé à l'ouverture (orphelins nettoyés selon ON DELETE).
// Usage : node scripts/test_integrite.cjs      Dépendance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (!ok && detail ? ' -- ' + detail : ''));
  if (!ok) failures++;
};

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modea-fk-'));
  const moto = path.join(tmp, 'moto.db'), abime = path.join(tmp, 'abime.db');
  cp.execFileSync('python3', [path.join(root, 'scripts', 'generate_sample_moto_db.py'), moto]);
  // modèle abîmé : suppressions faites clés étrangères inactives (comme après un enregistrement avant correction)
  fs.copyFileSync(moto, abime);
  cp.execFileSync('python3', ['-c', `
import sqlite3,sys
c=sqlite3.connect(sys.argv[1])  # foreign_keys inactif par défaut
c.execute("DELETE FROM objet WHERE nom='Carénage'")        # relation « Carrosserie contient Carénage » orpheline
c.execute("DELETE FROM objet WHERE nom='Batterie'")        # 2 affectations + 2 relations orphelines
c.execute("DELETE FROM domaine WHERE nom='Carrosserie'")   # objets pointant vers un domaine disparu (SET NULL)
c.commit()`, abime]);

  const w = new JSDOM(fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8'),
    { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: new VirtualConsole() }).window;
  await new Promise(r => setTimeout(r, 500));
  const n = sql => w.eval(`exec(${JSON.stringify(sql)})[0].n`);

  // 1) après un enregistrement
  w.__b = new Uint8Array(fs.readFileSync(moto)); await w.eval(`openBytes(__b,'moto.db')`);
  w.eval('currentBytes()'); // ce que font « Enregistrer » et « Télécharger une copie »
  check('clés étrangères toujours actives après un enregistrement', n('SELECT foreign_keys n FROM pragma_foreign_keys') === 1);
  w.eval(`run("DELETE FROM objet WHERE nom='Carénage'")`);
  check('supprimer un objet après un enregistrement supprime ses relations', n('SELECT COUNT(*) n FROM pragma_foreign_key_check') === 0);
  check('modèle sain : aucune réparation à l’ouverture', (await w.eval(`openBytes(__b,'moto.db')`), w.eval('dirty') === false));

  // 2) réparation d'un modèle abîmé
  w.__b = new Uint8Array(fs.readFileSync(abime)); await w.eval(`openBytes(__b,'abime.db')`);
  check('modèle abîmé : plus aucune référence orpheline après ouverture', n('SELECT COUNT(*) n FROM pragma_foreign_key_check') === 0);
  check('relations et affectations orphelines supprimées', n(`SELECT COUNT(*) n FROM relation WHERE source_id NOT IN (SELECT id FROM objet) OR cible_id NOT IN (SELECT id FROM objet)`) === 0
    && n(`SELECT COUNT(*) n FROM applicabilite WHERE objet_id NOT IN (SELECT id FROM objet)`) === 0);
  check('objets d’un domaine disparu conservés, domaine vidé (SET NULL)', n(`SELECT COUNT(*) n FROM objet WHERE nom='Selle' AND domaine_id IS NULL`) === 1);
  check('les autres données sont intactes', n('SELECT COUNT(*) n FROM objet') === 32 && n('SELECT COUNT(*) n FROM relation') === 37 - 3);
  check('réparation signalée et à enregistrer', w.eval('dirty') === true && /Modèle réparé : \d+ élément/.test(w.eval(`el('toasts').textContent`)));

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${failures ? 'ECHEC' : 'OK'} : ${failures} test(s) en echec`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
