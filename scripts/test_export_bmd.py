#!/usr/bin/env python3
"""Teste l'export BoMarkdown de l'editeur sur le modele d'exemple « moto ».

1) Coherence du fichier : le bloc ${{ }}$ est du JSON valide, chaque type utilise a son icone,
   chaque lien vise un alias declare et un type de lien defini, les regles suivent les compositions.
2) Si BoMarkdown Studio (../bomarkdown-studio/index.html, ou $BOMARKDOWN_STUDIO) et Chromium sont
   presents : le .bmd est charge dans Studio (sans navigateur visible), qui ne doit signaler aucun
   probleme ; un element place sous un parent qui ne le prevoit pas doit, lui, etre signale.

Dependances : node + jsdom (npm install --prefix scripts jsdom) ; chromium pour l'etape 2.
Usage : python3 scripts/test_export_bmd.py            (code de sortie 1 si un test echoue)
"""
import functools, html, http.server, json, os, re, shutil, subprocess, sys, tempfile, threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STUDIO = Path(os.environ.get('BOMARKDOWN_STUDIO', ROOT.parent / 'bomarkdown-studio' / 'index.html'))

failures = []
def check(label, ok, detail=""):
    print(("OK    " if ok else "ECHEC ") + label + (f" -- {detail}" if detail and not ok else ""))
    if not ok:
        failures.append(label)

def run(*a):
    r = subprocess.run(a, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"Commande en echec : {' '.join(map(str, a[:3]))}\n{r.stderr[-800:]}")

def studio_problems(tmp, bmd, icons):
    """Charge bmd dans une copie de Studio servie en local ; renvoie (problemes, nb d'elements)."""
    page = STUDIO.read_text(encoding='utf-8')
    pre = ("<script>localStorage.clear();localStorage.setItem('bomd.icons'," + json.dumps(json.dumps(icons))
           + ");localStorage.setItem('bomd.lang','\"fr\"');</script>")
    post = ("<script>setTimeout(()=>{const s=document.querySelector('#src');s.value=" + json.dumps(bmd)
            + ";s.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(()=>{const o=document.createElement('pre');"
            "o.id='OUT';o.textContent=JSON.stringify({items:document.querySelector('#st-items').textContent,"
            "probs:[...document.querySelectorAll('#problems-list .prob')].map(p=>p.innerText.replace(/\\s+/g,' '))});"
            "document.body.prepend(o);},1500);},800);</script>")
    d = Path(tmp) / 'studio'; d.mkdir(exist_ok=True)
    (d / 'index.html').write_text(page.replace('<head>', '<head>' + pre, 1).replace('</body>', post + '</body>', 1), encoding='utf-8')
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Silencieux, directory=str(d))
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        out = subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=6000',
                              '--dump-dom', f'http://127.0.0.1:{srv.server_port}/index.html'],
                             capture_output=True, text=True, timeout=60).stdout
    finally:
        srv.shutdown()
    m = re.search(r'<pre id="OUT">(.*?)</pre>', out, re.S)
    if not m:
        return None, None
    r = json.loads(html.unescape(m.group(1)))
    return r['probs'], r['items']

CHROME = next((shutil.which(c) for c in ('chromium-browser', 'chromium', 'google-chrome', 'google-chrome-stable') if shutil.which(c)), None)

def main():
    with tempfile.TemporaryDirectory() as tmp:
        db = Path(tmp) / "exemple-moto.db"
        run(sys.executable, str(ROOT / "scripts" / "generate_sample_moto_db.py"), str(db))
        out = Path(tmp) / "bmd"
        run("node", str(ROOT / "scripts" / "export_bmd.cjs"), str(db), str(out))
        bmd = (out / "exemple-moto-vocabulaire.bmd").read_text(encoding='utf-8')
        icons = json.loads((out / "exemple-moto_Icons.json").read_text(encoding='utf-8'))

        # 1) coherence
        m = re.match(r'\$\{\{\n(.*?)\n\}\}\$\n', bmd, re.S)
        check("le bloc ${{ }}$ ouvre le fichier", bool(m))
        try:
            entete = json.loads('{' + m.group(1) + '}')
            check("le bloc ${{ }}$ est du JSON valide", True)
        except Exception as e:
            check("le bloc ${{ }}$ est du JSON valide", False, str(e)); return
        lignes = [l for l in bmd.splitlines() if l.lstrip().startswith('+ ')]
        types = {t for l in lignes for t in re.findall(r'\(i:([^,)]+),', l)}
        alias = {a for l in lignes for a in re.findall(r'\(a:([^)]+)\)', l)}
        noms_icones = {i['name'] for i in icons}
        check("34 icones, une par objet", len(icons) == 34, str(len(icons)))
        check("chaque type utilise a son icone", types <= noms_icones, str(types - noms_icones))
        check("les icones sont des images SVG", all(i['icon'].startswith('data:image/svg+xml;base64,') for i in icons))
        liens = [(c, cs) for l in lignes for c, cs in re.findall(r'\(l:([^:)]+):([^)]+)\)', l)]
        check("chaque type de lien est defini", {c for c, _ in liens} <= set(entete['links']),
              str({c for c, _ in liens} - set(entete['links'])))
        cibles = {x for _, cs in liens for x in cs.split(',')}
        check("chaque lien vise un alias declare", cibles <= alias, str(cibles - alias))
        check("11 types de liens (un par verbe d'association)", len(entete['links']) == 11, str(len(entete['links'])))
        check("regle : motorisation contient moteur, boite, embrayage, echappement",
              entete['compat'].get('motorisation') == {'h': ['boite_de_vitesses', 'echappement', 'embrayage', 'moteur']},
              str(entete['compat'].get('motorisation')))
        check("le type abstrait « roue » est hors squelette mais a son icone",
              'roue' not in types and 'roue' in noms_icones)
        check("cardinalite 1..* affichee en etiquette", '(i:disque_de_frein,Disque de frein)(s:R)(a:disque_de_frein)(t:1..*,grey)' in bmd)

        # 2) chargement dans BoMarkdown Studio
        if not STUDIO.exists() or not CHROME:
            print(f"SAUTE chargement dans Studio ({'Studio introuvable : ' + str(STUDIO) if not STUDIO.exists() else 'chromium introuvable'})")
            return
        probs, items = studio_problems(tmp, bmd, icons)
        check("Studio affiche le squelette", items == '33 éléments', str(items))
        check("Studio ne signale aucun probleme", probs == [], str(probs))
        faux = bmd.replace("  + (i:echappement", "  + (i:selle,Selle mal placée)\n  + (i:echappement", 1)
        probs, _ = studio_problems(tmp, faux, icons)
        check("Studio signale une selle placee sous la motorisation",
              bool(probs) and len(probs) == 1 and 'hors règles sous « motorisation »' in probs[0], str(probs))

if __name__ == '__main__':
    main()
    print(f"\n{'ECHEC' if failures else 'OK'} : {len(failures)} test(s) en echec")
    sys.exit(1 if failures else 0)
