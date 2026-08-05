"""Genere sample-modele.db : un jeu de donnees d'exemple realiste (PLM),
construit en passant par les vues saisie_* -- exactement le chemin que KNIME
emprunte -- pour a la fois fournir une base de demo et exercer le schema."""
import sqlite3
import pathlib

base = pathlib.Path(__file__).parent.parent
out_path = base / "sample-modele.db"
if out_path.exists():
    out_path.unlink()

con = sqlite3.connect(out_path)
con.execute("PRAGMA foreign_keys = ON")
con.executescript((base / "metamodele.sql").read_text(encoding="utf-8"))
con.executescript((base / "saisie.sql").read_text(encoding="utf-8"))
cur = con.cursor()


def run(sql, params=()):
    cur.execute(sql, params)


# --- referentiels simples : insert direct ---
for code, nom in [("10", "Mécanique"), ("20", "Structure"), ("99", "Électricité")]:
    run("INSERT INTO discipline(code, nom) VALUES (?,?)", (code, nom))

# --- valeurs enum (auto-cree le type_enumere au passage) ---
for i, (val, lib) in enumerate(
    [("A", "À l'étude"), ("V", "En validation"), ("D", "Diffusé"), ("O", "Obsolète")], start=1
):
    run(
        "INSERT INTO saisie_valeur_enumeree(type_enumere, valeur, libelle, ordre) VALUES (?,?,?,?)",
        ("Statut cycle de vie", val, lib, i),
    )
for i, (val, lib) in enumerate([("F", "Faible"), ("M", "Moyenne"), ("H", "Haute")], start=1):
    run(
        "INSERT INTO saisie_valeur_enumeree(type_enumere, valeur, libelle, ordre) VALUES (?,?,?,?)",
        ("Criticité", val, lib, i),
    )

# --- unites (auto-cree la grandeur physique au passage) ---
for grandeur, symb, lib, ordre in [
    ("Pression", "bar", "bar", 1), ("Pression", "Pa", "pascal", 2),
    ("Masse", "kg", "kilogramme", 1), ("Masse", "g", "gramme", 2),
    ("Longueur", "mm", "millimètre", 1), ("Longueur", "m", "mètre", 2),
]:
    run(
        "INSERT INTO saisie_unite(grandeur, symbole, libelle, ordre) VALUES (?,?,?,?)",
        (grandeur, symb, lib, ordre),
    )

# --- objets ---
objets = [
    ("Item générique", "Engineering Item", "PLM", "Racine de généralisation pour les pièces mécaniques"),
    ("Vérin hydraulique VH-100", "Engineering Item", "PLM", "Actionneur linéaire hydraulique"),
    ("Support moteur SM-42", "Engineering Item", "PLM", "Pièce de fixation du moteur au châssis"),
    ("Carte électronique CE-7", "Engineering Item", "PLM", "Carte de commande basse tension"),
    ("Boîtier de commande BC-3", "Engineering Item", "PLM", "Boîtier abritant la carte de commande"),
    ("Châssis principal CH-1", "Engineering Item", "PLM", "Structure porteuse de l'ensemble"),
    ("Vue Design — Vérin VH-100", "Vue", "PLM", "Vue de conception du vérin"),
    ("Vue Fabrication — Vérin VH-100", "Vue", "PLM", "Vue destinée à l'atelier"),
    ("Vue Design — Carte CE-7", "Vue", "PLM", "Vue de conception de la carte électronique"),
    ("Nomenclature Ensemble hydraulique", "Nomenclature", "PLM", "BOM de l'ensemble hydraulique complet"),
    ("Spécification technique ST-12", "Document", "Qualité", "Cahier des charges du sous-ensemble"),
    ("Plan de contrôle PC-5", "Document", "Qualité", "Plan de contrôle qualité en réception"),
    ("Jean Dupont", "Acteur", "Ventes", "Ingénieur responsable du sous-ensemble hydraulique"),
    ("Marie Curie", "Acteur", "Qualité", "Qualiticienne en charge du contrôle réception"),
]
for nom, classe, domaine, definition in objets:
    run(
        "INSERT INTO saisie_objet(nom, domaine, classe, definition) VALUES (?,?,?,?)",
        (nom, domaine, classe, definition),
    )

# --- proprietes : definitions partagees ---
proprietes = [
    ("Statut", "enum", 0, "Statut cycle de vie", None, None, "Statut de cycle de vie de l'objet"),
    ("Criticité", "enum", 0, "Criticité", None, None, "Niveau de criticité fonctionnelle"),
    ("Poids", "grandeur", 0, None, "Masse", "kg", "Masse de la pièce"),
    ("Pression de service", "grandeur", 0, None, "Pression", "bar", "Pression nominale de service"),
    ("Longueur hors tout", "grandeur", 0, None, "Longueur", "mm", "Encombrement longitudinal"),
    ("Référence fournisseur", "identifiant", 0, None, None, None, "Référence catalogue fournisseur"),
    ("Matériau", "texte", 0, None, None, None, "Matériau principal de la pièce"),
]
for nom, type_, mv, type_enum, grandeur, unite, desc in proprietes:
    run(
        """INSERT INTO saisie_propriete(nom, type, multivalue, type_enumere, grandeur, unite, description)
           VALUES (?,?,?,?,?,?,?)""",
        (nom, type_, mv, type_enum, grandeur, unite, desc),
    )

# --- contraintes : regles de validation portees par la propriete (definition) ---
contraintes = [
    ("Référence fournisseur", "regex", r"^[A-Z0-9]{2,}-[A-Z0-9]+$", "Format attendu : PREFIXE-REFERENCE"),
    ("Poids", "min", "0", None),
    ("Pression de service", "min", "0", None),
    ("Pression de service", "max", "400", "Au-dela de 400 bar, verifier le circuit hydraulique"),
]
for propriete, type_, valeur, message in contraintes:
    run(
        "INSERT INTO saisie_contrainte(propriete, type, valeur, message) VALUES (?,?,?,?)",
        (propriete, type_, valeur, message),
    )

# --- applicabilite : affectation contextuelle (obligatoire, discipline) ---
applicabilites = [
    ("Vérin hydraulique VH-100", "Statut", 1, "10"),
    ("Vérin hydraulique VH-100", "Pression de service", 1, "10"),
    ("Vérin hydraulique VH-100", "Poids", 1, "20"),
    ("Vérin hydraulique VH-100", "Référence fournisseur", 1, None),
    ("Support moteur SM-42", "Statut", 1, "20"),
    ("Support moteur SM-42", "Poids", 1, "20"),
    ("Support moteur SM-42", "Matériau", 1, "20"),
    ("Carte électronique CE-7", "Statut", 1, "99"),
    ("Carte électronique CE-7", "Criticité", 1, "99"),
    ("Carte électronique CE-7", "Référence fournisseur", 0, "99"),
    ("Boîtier de commande BC-3", "Statut", 1, "99"),
    ("Boîtier de commande BC-3", "Poids", 0, "99"),
    ("Châssis principal CH-1", "Statut", 1, "20"),
    ("Châssis principal CH-1", "Longueur hors tout", 1, "20"),
    ("Châssis principal CH-1", "Matériau", 1, "20"),
]
for objet, propriete, obligatoire, discipline in applicabilites:
    run(
        "INSERT INTO saisie_applicabilite(objet, propriete, obligatoire, discipline) VALUES (?,?,?,?)",
        (objet, propriete, obligatoire, discipline),
    )

# --- relations ---
relations = [
    ("Vérin hydraulique VH-100", "hérite de", "generalisation", "Item générique", None, None),
    ("Support moteur SM-42", "hérite de", "generalisation", "Item générique", None, None),
    ("Carte électronique CE-7", "hérite de", "generalisation", "Item générique", None, None),
    ("Vérin hydraulique VH-100", "porte", "composition", "Vue Design — Vérin VH-100", "1", "0..*"),
    ("Vérin hydraulique VH-100", "porte", "composition", "Vue Fabrication — Vérin VH-100", "1", "0..*"),
    ("Carte électronique CE-7", "porte", "composition", "Vue Design — Carte CE-7", "1", "0..*"),
    ("Boîtier de commande BC-3", "contient", "composition", "Carte électronique CE-7", "1", "1..*"),
    ("Châssis principal CH-1", "supporte", "composition", "Support moteur SM-42", "1", "1..*"),
    ("Nomenclature Ensemble hydraulique", "contient", "agregation", "Vérin hydraulique VH-100", "1", "0..*"),
    ("Nomenclature Ensemble hydraulique", "contient", "agregation", "Support moteur SM-42", "1", "0..*"),
    ("Nomenclature Ensemble hydraulique", "contient", "agregation", "Châssis principal CH-1", "1", "0..*"),
    ("Spécification technique ST-12", "décrit", "association", "Vérin hydraulique VH-100", "0..1", "0..*"),
    ("Plan de contrôle PC-5", "s'applique à", "association", "Carte électronique CE-7", "0..1", "0..*"),
    ("Jean Dupont", "responsable de", "association", "Vérin hydraulique VH-100", "1", "0..*"),
    ("Marie Curie", "responsable de", "association", "Plan de contrôle PC-5", "1", "0..*"),
]
for source, nom, type_, cible, cs, cc in relations:
    if cs and cc:
        run(
            "INSERT INTO saisie_relation(source, relation, type, cible, card_source, card_cible) VALUES (?,?,?,?,?,?)",
            (source, nom, type_, cible, cs, cc),
        )
    else:
        run(
            "INSERT INTO saisie_relation(source, relation, type, cible) VALUES (?,?,?,?)",
            (source, nom, type_, cible),
        )

con.commit()

for label, table in [("objets", "objet"), ("proprietes", "propriete"), ("applicabilites", "applicabilite"),
                      ("relations", "relation"), ("disciplines", "discipline"), ("unites", "unite"),
                      ("valeurs enum", "valeur_enumeree")]:
    n = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    print(f"{label}: {n}")

con.close()
print(f"\n{out_path.name} genere avec succes.")
