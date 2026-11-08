#!/usr/bin/env python3
"""Teste les exports RDF/OWL et SHACL de l'editeur sur le modele d'exemple « moto ».

Verifie : les trois fichiers Turtle se chargent (rdflib), toutes les IRI utilisees sont
declarees, le SHACL est valide (meta-SHACL pyshacl), et, sur des instances de test, les
donnees correctes sont acceptees et les donnees incompletes ou en trop sont rejetees.
Cas de regression : un meme verbe (« contient ») vers plusieurs classes cibles.

Dependances : node + jsdom (npm install --prefix scripts jsdom), python : rdflib, pyshacl.
Usage : python3 scripts/test_exports.py            (code de sortie 1 si un test echoue)
"""
import subprocess, sys, tempfile
from pathlib import Path

from rdflib import Graph, RDF, OWL
from pyshacl import validate

ROOT = Path(__file__).resolve().parent.parent
BASE = "http://example.org/modea/exemple-moto#"

INSTANCES = """@prefix : <%s> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
:m1 a :Motorisation ; :contient :mo1, :bv1, :em1, :ec1 .
:mo1 a :Moteur ; :cylindree "649"^^xsd:decimal ; :puissance_maximale "50"^^xsd:decimal ;
     :couple_maximal "64"^^xsd:decimal ; :refroidissement "LIQ" ; :norme_antipollution "E5" ;
     :est_alimente_par :inj1 .
:bv1 a :Boite_de_vitesses ; :reference_fournisseur "BV-6" .
:em1 a :Embrayage .
:ec1 a :Echappement ; :norme_antipollution "E5" .
:inj1 a :Injection .
""" % BASE

failures = []
def check(label, ok, detail=""):
    print(("OK    " if ok else "ECHEC ") + label + (f" -- {detail}" if detail and not ok else ""))
    if not ok:
        failures.append(label)

def main():
    # 1) base d'exemple + exports produits par les vraies fonctions de l'editeur
    def run(*a):
        r = subprocess.run(a, capture_output=True, text=True)
        if r.returncode:
            sys.exit(f"Commande en echec : {' '.join(a[:3])}\n{r.stderr[-800:]}")
    with tempfile.TemporaryDirectory() as tmp:
        db = Path(tmp) / "exemple-moto.db"
        run(sys.executable, str(ROOT / "scripts" / "generate_sample_moto_db.py"), str(db))
        out = Path(tmp) / "ttl"
        run("node", str(ROOT / "scripts" / "export_ttl.cjs"), str(db), str(out), BASE)

        graphs = {}
        for name in ("modele.ttl", "modele.shapes.ttl", "modele.liens.ttl"):
            try:
                graphs[name] = Graph().parse(out / name, format="turtle")
                check(f"{name} : chargement rdflib", True)
            except Exception as e:
                check(f"{name} : chargement rdflib", False, str(e)); return
        onto, shapes = graphs["modele.ttl"], graphs["modele.shapes.ttl"]

        # 2) coherence du RDF/OWL
        check("34 owl:Class", len(set(onto.subjects(RDF.type, OWL.Class))) == 34)
        used = {x for t in onto for x in t if str(x).startswith(BASE)}
        declared = {s for s in onto.subjects(RDF.type, None) if str(s).startswith(BASE)}
        check("IRI utilisees toutes declarees", not (used - declared), str(sorted(used - declared)[:5]))

        # 3) SHACL valide + comportement sur instances
        conforms, _, txt = validate(shapes, shacl_graph=shapes, meta_shacl=True)
        check("SHACL : meta-validation", conforms, txt[:300])

        def inst(label, ttl, expected):
            conforms, _, txt = validate(Graph().parse(data=ttl, format="turtle"), shacl_graph=shapes)
            check(f"instances : {label} -> {'conforme' if expected else 'rejete'}", conforms == expected, txt[:400])

        inst("motorisation complete (meme verbe, 4 classes cibles)", INSTANCES, True)
        inst("sans embrayage", INSTANCES.replace(", :em1", ""), False)
        inst("deux moteurs", INSTANCES.replace(":contient :mo1,", ":contient :mo1, :mo2,") + ":mo2 a :Moteur .\n", False)
        inst("cylindree manquante", INSTANCES.replace(':cylindree "649"^^xsd:decimal ;', ""), False)
        inst("moteur sans injection", INSTANCES.replace(" ;\n     :est_alimente_par :inj1", ""), False)

if __name__ == "__main__":
    main()
    print(f"\n{len(failures)} echec(s)" if failures else "\nTous les tests passent.")
    sys.exit(1 if failures else 0)
