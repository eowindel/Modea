"""Genere exemple-moto.db : un modele de domaine fictif autour de la nomenclature
d'une moto (motorisation, partie-cycle, electricite, carrosserie...), pour la demo et les
captures d'ecran. Construit via les vues saisie_*, comme generate_sample_db.py."""
import sqlite3
import pathlib

base = pathlib.Path(__file__).parent.parent
out_path = base / "exemple-moto.db"
if out_path.exists():
    out_path.unlink()

con = sqlite3.connect(out_path)
con.execute("PRAGMA foreign_keys = ON")
con.executescript((base / "metamodele.sql").read_text(encoding="utf-8"))
con.executescript((base / "saisie.sql").read_text(encoding="utf-8"))
cur = con.cursor()
run = cur.execute

# --- referentiels ---
for code, nom in [("10", "Mécanique"), ("20", "Châssis"), ("30", "Électricité"), ("40", "Qualité")]:
    run("INSERT INTO discipline(code, nom) VALUES (?,?)", (code, nom))

enums = {
    "Refroidissement": [("AIR", "Air"), ("LIQ", "Liquide"), ("AHU", "Air et huile")],
    "Norme antipollution": [("E4", "Euro 4"), ("E5", "Euro 5"), ("E5P", "Euro 5+")],
    "Type de frein": [("DIS", "Disque"), ("TAM", "Tambour")],
}
for te, vals in enums.items():
    for i, (v, lib) in enumerate(vals, start=1):
        run("INSERT INTO saisie_valeur_enumeree(type_enumere, valeur, libelle, ordre) VALUES (?,?,?,?)", (te, v, lib, i))

for grandeur, symb, lib, ordre in [
    ("Volume", "cm³", "centimètre cube", 1), ("Volume", "L", "litre", 2),
    ("Puissance", "kW", "kilowatt", 1), ("Puissance", "ch", "cheval-vapeur", 2),
    ("Couple", "N·m", "newton-mètre", 1),
    ("Masse", "kg", "kilogramme", 1), ("Masse", "g", "gramme", 2),
    ("Longueur", "mm", "millimètre", 1), ("Longueur", "m", "mètre", 2),
    ("Tension", "V", "volt", 1),
]:
    run("INSERT INTO saisie_unite(grandeur, symbole, libelle, ordre) VALUES (?,?,?,?)", (grandeur, symb, lib, ordre))

# --- objets : (nom, nature, domaine, definition, statut) ---
V, B, O = "valide", "brouillon", "obsolete"
objets = [
    ("Moto", "Produit", "Produit", "Véhicule complet vendu au client", V),
    ("Motorisation", "Ensemble", "Motorisation", "Groupe motopropulseur de la moto", V),
    ("Moteur", "Composant", "Motorisation", "Bloc moteur bicylindre", V),
    ("Boîte de vitesses", "Composant", "Motorisation", "Boîte à 6 rapports", V),
    ("Embrayage", "Composant", "Motorisation", "Embrayage multidisque à bain d'huile", V),
    ("Échappement", "Composant", "Motorisation", "Ligne d'échappement avec catalyseur", B),
    ("Carburateur", "Composant", "Motorisation", "Ancien système d'alimentation", O),
    ("Injection", "Composant", "Motorisation", "Système d'injection électronique", V),
    ("Partie-cycle", "Ensemble", "Partie-cycle", "Ensemble porteur, suspension et freinage", V),
    ("Cadre", "Composant", "Partie-cycle", "Cadre treillis en acier", V),
    ("Fourche", "Composant", "Partie-cycle", "Fourche télescopique inversée", V),
    ("Bras oscillant", "Composant", "Partie-cycle", "Bras de suspension arrière", V),
    ("Amortisseur arrière", "Composant", "Partie-cycle", "Amortisseur réglable en précharge", B),
    ("Roue", "Composant", "Partie-cycle", "Racine de généralisation des roues", V),
    ("Roue avant", "Composant", "Partie-cycle", "Roue de 17 pouces à l'avant", V),
    ("Roue arrière", "Composant", "Partie-cycle", "Roue de 17 pouces à l'arrière", V),
    ("Système de freinage", "Ensemble", "Partie-cycle", "Freins avant et arrière avec ABS", V),
    ("Disque de frein", "Composant", "Partie-cycle", "Disque flottant ventilé", V),
    ("Étrier de frein", "Composant", "Partie-cycle", "Étrier à quatre pistons", V),
    ("Réservoir", "Composant", "Carrosserie", "Réservoir de carburant", V),
    ("Système électrique", "Ensemble", "Électricité", "Alimentation, commande et éclairage", V),
    ("Batterie", "Composant", "Électricité", "Batterie 12 V", V),
    ("Alternateur", "Composant", "Électricité", "Génération de courant", V),
    ("Calculateur moteur", "Composant", "Électricité", "Unité de contrôle du moteur (ECU)", B),
    ("Faisceau électrique", "Composant", "Électricité", "Câblage principal", V),
    ("Phare", "Composant", "Électricité", "Éclairage avant à LED", V),
    ("Carrosserie", "Ensemble", "Carrosserie", "Habillage et selle", V),
    ("Selle", "Composant", "Carrosserie", "Selle pilote", V),
    ("Carénage", "Composant", "Carrosserie", "Carénage avant", B),
    ("Spécification moteur", "Document", "Qualité", "Cahier des charges du moteur", V),
    ("Plan de contrôle freinage", "Document", "Qualité", "Contrôles en production du système de freinage", V),
    ("Homologation Euro 5", "Document", "Qualité", "Dossier d'homologation antipollution", B),
    ("Chef de projet", "Acteur", "Produit", "Responsable de la gamme", V),
    ("Fournisseur freinage", "Acteur", "Achats", "Fournisseur des disques et étriers", V),
]
for nom, nature, domaine, definition, statut in objets:
    run("INSERT INTO saisie_objet(nom, domaine, classe, definition, statut) VALUES (?,?,?,?,?)",
        (nom, domaine, nature, definition, statut))

# --- proprietes ---
proprietes = [
    ("Cylindrée", "grandeur", "Volume", "cm³", "Volume balayé par les pistons"),
    ("Puissance maximale", "grandeur", "Puissance", "kW", "Puissance au régime maximal"),
    ("Couple maximal", "grandeur", "Couple", "N·m", "Couple au régime de pointe"),
    ("Masse", "grandeur", "Masse", "kg", "Masse de l'élément"),
    ("Diamètre", "grandeur", "Longueur", "mm", "Diamètre nominal"),
    ("Empattement", "grandeur", "Longueur", "mm", "Distance entre les axes de roues"),
    ("Capacité", "grandeur", "Volume", "L", "Contenance"),
    ("Tension nominale", "grandeur", "Tension", "V", "Tension de service"),
    ("Refroidissement", "enum", None, None, "Mode de refroidissement"),
    ("Norme antipollution", "enum", None, None, "Norme respectée"),
    ("Type de frein", "enum", None, None, "Technologie de freinage"),
    ("Matériau", "texte", None, None, "Matériau principal"),
    ("Référence fournisseur", "identifiant", None, None, "Référence catalogue fournisseur"),
    ("Date de diffusion", "date", None, None, "Date de mise à disposition"),
]
for nom, type_, grandeur, unite, desc in proprietes:
    te = nom if type_ == "enum" else None
    run("INSERT INTO saisie_propriete(nom, type, multivalue, type_enumere, grandeur, unite, description) VALUES (?,?,0,?,?,?,?)",
        (nom, type_, te, grandeur, unite, desc))

for propriete, type_, valeur, message in [
    ("Référence fournisseur", "regex", r"^[A-Z0-9]{2,}-[A-Z0-9]+$", "Format attendu : PREFIXE-REFERENCE"),
    ("Masse", "min", "0", None),
    ("Cylindrée", "min", "50", None),
    ("Tension nominale", "max", "48", "Au-delà de 48 V, revoir la sécurité électrique"),
]:
    run("INSERT INTO saisie_contrainte(propriete, type, valeur, message) VALUES (?,?,?,?)", (propriete, type_, valeur, message))

# --- applicabilite : (objet, propriete, obligatoire, discipline) ---
appl = [
    ("Moteur", "Cylindrée", 1, "10"), ("Moteur", "Puissance maximale", 1, "10"), ("Moteur", "Couple maximal", 1, "10"),
    ("Moteur", "Refroidissement", 1, "10"), ("Moteur", "Norme antipollution", 1, "40"), ("Moteur", "Masse", 0, "10"),
    ("Boîte de vitesses", "Masse", 0, "10"), ("Boîte de vitesses", "Référence fournisseur", 1, None),
    ("Échappement", "Norme antipollution", 1, "40"), ("Échappement", "Matériau", 0, "10"),
    ("Cadre", "Matériau", 1, "20"), ("Cadre", "Masse", 1, "20"), ("Cadre", "Empattement", 1, "20"),
    ("Fourche", "Diamètre", 1, "20"), ("Fourche", "Référence fournisseur", 0, None),
    ("Roue", "Diamètre", 1, "20"), ("Roue", "Masse", 0, "20"),
    ("Disque de frein", "Diamètre", 1, "20"), ("Disque de frein", "Matériau", 0, "20"), ("Disque de frein", "Référence fournisseur", 1, None),
    ("Étrier de frein", "Type de frein", 1, "20"), ("Étrier de frein", "Référence fournisseur", 1, None),
    ("Réservoir", "Capacité", 1, "20"), ("Réservoir", "Matériau", 0, "20"),
    ("Batterie", "Tension nominale", 1, "30"), ("Batterie", "Référence fournisseur", 0, None),
    ("Alternateur", "Tension nominale", 1, "30"), ("Alternateur", "Puissance maximale", 0, "30"),
    ("Calculateur moteur", "Tension nominale", 1, "30"),
    ("Spécification moteur", "Date de diffusion", 1, "40"), ("Homologation Euro 5", "Date de diffusion", 0, "40"),
]
for objet, propriete, obligatoire, discipline in appl:
    run("INSERT INTO saisie_applicabilite(objet, propriete, obligatoire, discipline) VALUES (?,?,?,?)",
        (objet, propriete, obligatoire, discipline))

# --- relations : (source, verbe, type, cible, card_source, card_cible) ---
def comp(s, c, cc="1"): return (s, "contient", "composition", c, "1", cc)
rels = [
    comp("Moto", "Motorisation"), comp("Moto", "Partie-cycle"), comp("Moto", "Système électrique"), comp("Moto", "Carrosserie"),
    comp("Motorisation", "Moteur"), comp("Motorisation", "Boîte de vitesses"), comp("Motorisation", "Embrayage"),
    comp("Motorisation", "Échappement"),
    ("Moteur", "est alimenté par", "association", "Injection", "1", "1"),
    ("Moteur", "était alimenté par", "association", "Carburateur", "0..*", "0..1"),
    comp("Partie-cycle", "Cadre"), comp("Partie-cycle", "Fourche"), comp("Partie-cycle", "Bras oscillant"),
    comp("Partie-cycle", "Amortisseur arrière"), comp("Partie-cycle", "Système de freinage"),
    comp("Partie-cycle", "Roue avant"), comp("Partie-cycle", "Roue arrière"),
    ("Roue avant", "hérite de", "generalisation", "Roue", None, None),
    ("Roue arrière", "hérite de", "generalisation", "Roue", None, None),
    comp("Système de freinage", "Disque de frein", "1..*"), comp("Système de freinage", "Étrier de frein", "1..*"),
    ("Étrier de frein", "agit sur", "association", "Disque de frein", "1", "1"),
    comp("Système électrique", "Batterie"), comp("Système électrique", "Alternateur"),
    comp("Système électrique", "Faisceau électrique"), comp("Système électrique", "Phare"),
    ("Calculateur moteur", "pilote", "association", "Injection", "1", "1"),
    ("Alternateur", "recharge", "association", "Batterie", "1", "1"),
    comp("Carrosserie", "Selle"), comp("Carrosserie", "Carénage"),
    ("Réservoir", "est fixé sur", "association", "Cadre", "1", "1"),
    ("Spécification moteur", "décrit", "association", "Moteur", "0..*", "1"),
    ("Plan de contrôle freinage", "contrôle", "association", "Système de freinage", "0..*", "1"),
    ("Homologation Euro 5", "concerne", "association", "Échappement", "0..*", "1"),
    ("Chef de projet", "responsable de", "association", "Moto", "1", "0..*"),
    ("Fournisseur freinage", "fournit", "association", "Disque de frein", "1", "0..*"),
    ("Fournisseur freinage", "fournit", "association", "Étrier de frein", "1", "0..*"),
]
for s, nom, type_, c, cs, cc in rels:
    if cs and cc:
        run("INSERT INTO saisie_relation(source, relation, type, cible, card_source, card_cible) VALUES (?,?,?,?,?,?)", (s, nom, type_, c, cs, cc))
    else:
        run("INSERT INTO saisie_relation(source, relation, type, cible) VALUES (?,?,?,?)", (s, nom, type_, c))

con.commit()
for label, table in [("objets", "objet"), ("proprietes", "propriete"), ("applicabilites", "applicabilite"),
                     ("relations", "relation"), ("domaines", "domaine"), ("natures", "classe_objet")]:
    print(f"{label}: {cur.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]}")
con.close()
print(f"\n{out_path.name} genere avec succes.")
