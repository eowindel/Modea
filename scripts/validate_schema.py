import sqlite3
import pathlib

base = pathlib.Path(__file__).parent.parent

con = sqlite3.connect(":memory:")
con.execute("PRAGMA foreign_keys = ON")
con.executescript((base / "metamodele.sql").read_text(encoding="utf-8"))
con.executescript((base / "saisie.sql").read_text(encoding="utf-8"))

cur = con.cursor()

# --- classe / domaine / discipline (insert direct) ---
cur.execute("INSERT INTO classe_objet(nom) VALUES ('Produit')")
cur.execute("INSERT INTO classe_objet(nom) VALUES ('Fiche')")
cur.execute("INSERT INTO discipline(code, nom) VALUES ('99','Electricite')")
cur.execute("INSERT INTO discipline(code, nom) VALUES ('10','Mecanique')")

# --- objets ---
cur.execute("INSERT INTO saisie_objet(nom, classe, definition) VALUES ('Piece mecanique','Produit','...')")
cur.execute("INSERT INTO saisie_objet(nom, classe, definition) VALUES ('Piece electrique','Produit','...')")
cur.execute("INSERT INTO saisie_objet(nom, classe, definition) VALUES ('Fiche conception','Fiche','...')")

# --- propriete partagee (enum) ---
cur.execute("INSERT INTO saisie_valeur_enumeree(type_enumere, valeur, libelle, ordre) VALUES ('Statut cycle de vie','A','A l etude',1)")
cur.execute("INSERT INTO saisie_valeur_enumeree(type_enumere, valeur, libelle, ordre) VALUES ('Statut cycle de vie','B','Valide',2)")
cur.execute("INSERT INTO saisie_propriete(nom, type, type_enumere, multivalue, description) VALUES ('Statut','enum','Statut cycle de vie',0,'...')")

# affectation de la meme propriete sur 2 objets, discipline differente
cur.execute("INSERT INTO saisie_applicabilite(objet, propriete, obligatoire, discipline) VALUES ('Piece mecanique','Statut',1,'10')")
cur.execute("INSERT INTO saisie_applicabilite(objet, propriete, obligatoire, discipline) VALUES ('Piece electrique','Statut',0,'99')")

# --- edition de la definition partagee : doit se repercuter partout ---
cur.execute("UPDATE saisie_propriete SET type='enum', type_enumere='Statut cycle de vie', multivalue=0, description='desc modifiee' WHERE nom='Statut'")

# --- edition d'une applicabilite ---
cur.execute("UPDATE saisie_applicabilite SET obligatoire=1, discipline='99' WHERE objet='Piece mecanique' AND propriete='Statut'")

# --- propriete de type grandeur physique (Pression en bar) ---
cur.execute("INSERT INTO saisie_unite(grandeur, symbole, libelle, ordre) VALUES ('Pression','bar','bar',1)")
cur.execute("INSERT INTO saisie_unite(grandeur, symbole, libelle, ordre) VALUES ('Pression','Pa','pascal',2)")
cur.execute("INSERT INTO saisie_propriete(nom, type, grandeur, unite, description) VALUES ('Pression amont','grandeur','Pression','bar','...')")
cur.execute("INSERT INTO saisie_applicabilite(objet, propriete, obligatoire) VALUES ('Piece mecanique','Pression amont',1)")

# --- generalisation + heritage effectif ---
cur.execute("INSERT INTO saisie_objet(nom, classe, definition) VALUES ('Item generique','Produit','...')")
cur.execute("INSERT INTO saisie_propriete(nom, type, description) VALUES ('Reference','texte','...')")
cur.execute("INSERT INTO saisie_applicabilite(objet, propriete, obligatoire) VALUES ('Item generique','Reference',1)")
cur.execute("INSERT INTO saisie_relation(source, relation, type, cible) VALUES ('Piece mecanique','herite de','generalisation','Item generique')")

con.commit()

print("--- v_applicabilite ---")
for row in cur.execute("SELECT objet, propriete, obligatoire, discipline_code, description FROM v_applicabilite v JOIN propriete p ON p.nom=v.propriete"):
    print(row)

print("--- propriete apres update (doit montrer 'desc modifiee') ---")
for row in cur.execute("SELECT nom, description FROM propriete WHERE nom='Statut'"):
    print(row)

print("--- v_propriete_effective pour Piece mecanique (doit inclure Statut + Reference heritee + Pression amont[bar]) ---")
for row in cur.execute("SELECT objet, propriete, grandeur, unite, obligatoire, heritee, heritee_de FROM v_propriete_effective WHERE objet='Piece mecanique'"):
    print(row)

print("--- garde-fous : doivent lever une erreur ---")
for label, sql, params in [
    ("objet inconnu (applicabilite)", "INSERT INTO saisie_applicabilite(objet, propriete) VALUES ('Bidule','Statut')", ()),
    ("propriete inconnue (applicabilite)", "INSERT INTO saisie_applicabilite(objet, propriete) VALUES ('Piece mecanique','Bidule')", ()),
    ("discipline inconnue", "INSERT INTO saisie_applicabilite(objet, propriete, discipline) VALUES ('Piece mecanique','Statut','77')", ()),
    ("enum sans type_enumere (CHECK table)", "INSERT INTO propriete(nom, type) VALUES ('X','enum')", ()),
    ("grandeur sans unite (CHECK table)", "INSERT INTO propriete(nom, type) VALUES ('Y','grandeur')", ()),
    ("unite inconnue (saisie_propriete)", "INSERT INTO saisie_propriete(nom, type, grandeur, unite) VALUES ('Masse','grandeur','Masse','kg')", ()),
    ("doublon applicabilite (UNIQUE)", "INSERT INTO saisie_applicabilite(objet, propriete) VALUES ('Piece mecanique','Statut')", ()),
]:
    try:
        cur.execute(sql, params)
        print(f"[FAIL] {label} : aucune erreur levee")
    except sqlite3.Error as e:
        print(f"[OK] {label} -> {e}")

con.close()
print("Validation terminee sans crash.")
