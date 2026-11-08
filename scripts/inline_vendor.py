#!/usr/bin/env python3
"""Injecte (ou rafraichit) les bibliotheques de vendor/ dans les pages HTML pour un
fonctionnement 100 % hors-ligne, y compris ouvert depuis le disque (file://).

Usage : python3 scripts/inline_vendor.py [fichier.html ...]   (defaut : les deux pages)
Les bibliotheques sont placees juste avant </body>, entre deux marqueurs, en blocs
<script type="text/plain" id="vendor-..."> lus par vendorText()/runVendor() dans la page.
"""
import base64, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / "vendor"
BEGIN, END = "<!-- VENDOR:BEGIN (genere par scripts/inline_vendor.py - ne pas editer) -->", "<!-- VENDOR:END -->"
LIBS = {  # id -> (fichier, binaire ?)
    "sqljs": ("sql-wasm.js", False),
    "sqlwasm": ("sql-wasm.wasm", True),
    "cytoscape": ("cytoscape.min.js", False),
    "cytoscape-svg": ("cytoscape-svg.min.js", False),
}

def block(ids):
    out = [BEGIN]
    for i in ids:
        f, binary = LIBS[i]
        data = (V / f).read_bytes()
        txt = base64.b64encode(data).decode() if binary else data.decode("utf-8")
        assert "</script" not in txt.lower(), f
        out.append(f'<script type="text/plain" id="vendor-{i}">{txt}</script>')
    out.append(END)
    return "\n".join(out) + "\n"

def process(path, ids):
    s = path.read_text(encoding="utf-8")
    s = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END) + r"\n?", "", s, flags=re.S)
    i = s.rindex("</body>")
    path.write_text(s[:i] + block(ids) + s[i:], encoding="utf-8")
    print("OK", path.name)

if __name__ == "__main__":
    targets = [Path(a) for a in sys.argv[1:]]
    if targets:
        for t in targets: process(t, list(LIBS))
    else:
        process(ROOT / "modea-editeur.html", list(LIBS))
        process(ROOT / "demo-cytoscape.html", ["sqljs", "sqlwasm", "cytoscape"])
