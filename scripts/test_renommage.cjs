// Teste le renommage d'un objet et d'une propriété depuis leur fiche (issue #20) avec les vraies
// fonctions de modea-editeur.html, dans jsdom : pas de doublon, liens conservés, nom déjà pris refusé,
// annulation, fiche supprimée pendant sa modification.
// Usage : node scripts/test_renommage.cjs      Dépendance : jsdom (npm install --prefix scripts jsdom).
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (!ok && detail ? ' -- ' + detail : ''));
  if (!ok) failures++;
};

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'modea-ren-'));
  const moto = path.join(tmp, 'moto.db');
  cp.execFileSync('python3', [path.join(root, 'scripts', 'generate_sample_moto_db.py'), moto]);

  const w = new JSDOM(fs.readFileSync(path.join(root, 'modea-editeur.html'), 'utf8'),
    { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/', virtualConsole: new VirtualConsole() }).window;
  await new Promise(r => setTimeout(r, 500));
  const q = sql => w.eval(`exec(${JSON.stringify(sql)})`);
  const set = (id, val) => { const e = w.document.getElementById(id); e.value = val; e.dispatchEvent(new w.Event('change')); };
  const val = id => w.document.getElementById(id).value;
  const shown = id => w.document.getElementById(id).style.display !== 'none';

  w.__b = new Uint8Array(fs.readFileSync(moto)); await w.eval(`openBytes(__b,'moto.db')`);
  const n = t => q(`SELECT COUNT(*) n FROM ${t}`)[0].n;

  // ---- Objet
  const o = q(`SELECT o.id,o.uid,o.nom,o.definition,
      (SELECT COUNT(*) FROM applicabilite WHERE objet_id=o.id) na,
      (SELECT COUNT(*) FROM relation WHERE source_id=o.id OR cible_id=o.id) nr
    FROM objet o ORDER BY na+nr DESC LIMIT 1`)[0];
  const autre = q(`SELECT nom FROM objet WHERE id<>${o.id} LIMIT 1`)[0].nom;
  const nObj = n('objet');

  w.eval(`editObjetRow(${o.id})`);
  check('objet : fiche ouverte en modification, bouton Annuler visible',
    val('o_nom') === o.nom && shown('cancelObjetEdit') && w.document.getElementById('addObjet').textContent === "Mettre à jour l'objet");
  set('o_nom', o.nom + ' renommé'); set('o_def', 'déf modifiée');
  check('objet : changer le nom garde le mode modification', w.eval('objEditUid') === o.uid && val('o_def') === 'déf modifiée');
  w.eval('addOrUpdateObjet()');
  const o2 = q(`SELECT uid,nom,definition,(SELECT COUNT(*) FROM applicabilite WHERE objet_id=${o.id}) na,
      (SELECT COUNT(*) FROM relation WHERE source_id=${o.id} OR cible_id=${o.id}) nr FROM objet WHERE id=${o.id}`)[0];
  check('objet : renommé sur place, sans doublon', n('objet') === nObj && o2.nom === o.nom + ' renommé' && o2.uid === o.uid, JSON.stringify(o2));
  check('objet : autres champs mis à jour', o2.definition === 'déf modifiée');
  check('objet : propriétés et relations conservées', o2.na === o.na && o2.nr === o.nr && o.na + o.nr > 0);
  check('objet : retour au mode création', w.eval('objEditUid') === null && !shown('cancelObjetEdit') && val('o_nom') === '');

  w.eval(`editObjetRow(${o.id})`); set('o_nom', autre); w.eval('addOrUpdateObjet()');
  check('objet : nom déjà pris refusé', q(`SELECT nom FROM objet WHERE id=${o.id}`)[0].nom === o.nom + ' renommé' && n('objet') === nObj
    && w.eval('objEditUid') === o.uid);
  w.eval(`resetObjetForm()`);

  w.eval(`editObjetRow(${o.id})`); set('o_nom', 'ne pas garder'); w.document.getElementById('cancelObjetEdit').click();
  check('objet : annuler ne modifie rien', q(`SELECT nom FROM objet WHERE id=${o.id}`)[0].nom === o.nom + ' renommé' && val('o_nom') === '' && w.eval('objEditUid') === null);

  set('o_nom', autre);
  check('objet : saisir un nom existant ouvre sa fiche', w.eval('objEditUid') !== null && shown('cancelObjetEdit'));
  w.eval(`resetObjetForm()`);

  w.eval(`editObjetRow(${o.id})`); w.eval(`run("DELETE FROM objet WHERE id=${o.id}")`); w.eval('addOrUpdateObjet()');
  check('objet supprimé entre-temps : pas recréé', n('objet') === nObj - 1 && w.eval('objEditUid') === null);

  // ---- Propriété
  const p = q(`SELECT p.id,p.uid,p.nom,(SELECT COUNT(*) FROM applicabilite WHERE propriete_id=p.id) na
    FROM propriete p ORDER BY na DESC LIMIT 1`)[0];
  const autreP = q(`SELECT nom FROM propriete WHERE id<>${p.id} LIMIT 1`)[0].nom;
  const nProp = n('propriete');

  w.eval(`editPropRow(${p.id})`);
  check('propriété : fiche ouverte en modification', val('p_nom') === p.nom && shown('cancelPropEdit'));
  set('p_nom', p.nom + '_v2'); set('p_desc', 'desc modifiée'); w.eval('addOrUpdateProp()');
  const p2 = q(`SELECT uid,nom,description,(SELECT COUNT(*) FROM applicabilite WHERE propriete_id=${p.id}) na FROM propriete WHERE id=${p.id}`)[0];
  check('propriété : renommée sur place, sans doublon', n('propriete') === nProp && p2.nom === p.nom + '_v2' && p2.uid === p.uid, JSON.stringify(p2));
  check('propriété : affectations conservées, description mise à jour', p2.na === p.na && p.na > 0 && p2.description === 'desc modifiée');

  w.eval(`editPropRow(${p.id})`); set('p_nom', autreP); w.eval('addOrUpdateProp()');
  check('propriété : nom déjà pris refusé', q(`SELECT nom FROM propriete WHERE id=${p.id}`)[0].nom === p.nom + '_v2' && n('propriete') === nProp);
  w.document.getElementById('cancelPropEdit').click();
  check('propriété : annuler revient au mode création', w.eval('propEditUid') === null && val('p_nom') === ''
    && w.document.getElementById('addProp').textContent === 'Créer la propriété');

  w.eval(`editPropRow(${p.id})`); w.eval(`confirm=()=>true; deleteProp(${p.id})`);
  check('propriété supprimée pendant sa modification : formulaire libéré', w.eval('propEditUid') === null && n('propriete') === nProp - 1);

  console.log(failures ? `\n${failures} échec(s)` : '\nTout est OK');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
