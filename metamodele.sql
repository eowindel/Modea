-- =============================================================================
--  Métamodèle "Modèle de Donnée Métier"
--  Structure neutre entité / attribut / relation, projetable vers UML (Modelio)
--  ou ArchiMate. À charger dans une base SQLite vierge.
--
--  Usage :  sqlite3 mdm.db < metamodele.sql
--
--  Principe clé de cette version : une PROPRIETE est une définition partagée
--  (pas une instance liée à un seul objet). Elle est rattachée à N objets via
--  la table d'APPLICABILITE, qui porte ce qui est contextuel à l'usage
--  (obligatoire, discipline). Modifier une propriété (ou sa liste de valeurs
--  si elle est de type enum) se répercute donc partout où elle est affectée.
-- =============================================================================

PRAGMA foreign_keys = ON;   -- OFF par défaut sous SQLite : à réactiver à CHAQUE connexion

-- -----------------------------------------------------------------------------
--  Domaine fonctionnel — regroupement métier des objets (facultatif mais utile)
-- -----------------------------------------------------------------------------
CREATE TABLE domaine (
    id          INTEGER PRIMARY KEY,
    nom         TEXT NOT NULL UNIQUE,
    description TEXT
);

-- -----------------------------------------------------------------------------
--  Classe d'objet — nature/stéréotype de classement (PAS un mécanisme
--  d'héritage : deux objets de même classe ne partagent pas leurs propriétés
--  de fait). L'héritage réel passe par relation.type = 'generalisation'.
-- -----------------------------------------------------------------------------
CREATE TABLE classe_objet (
    id          INTEGER PRIMARY KEY,
    nom         TEXT NOT NULL UNIQUE,
    description TEXT
);

-- -----------------------------------------------------------------------------
--  Discipline — référentiel métier (ex : 99 | Electricité), utilisé pour
--  qualifier l'affectation d'une propriété à un objet donné.
-- -----------------------------------------------------------------------------
CREATE TABLE discipline (
    id          INTEGER PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,          -- numéro métier, ex "99"
    nom         TEXT NOT NULL                  -- libellé, ex "Electricité"
);

-- -----------------------------------------------------------------------------
--  Type énuméré — liste de valeurs nommée et réutilisable entre plusieurs
--  propriétés (ex : "Statut de cycle de vie" utilisé sur plusieurs objets).
-- -----------------------------------------------------------------------------
CREATE TABLE type_enumere (
    id          INTEGER PRIMARY KEY,
    nom         TEXT NOT NULL UNIQUE
);

CREATE TABLE valeur_enumeree (
    id              INTEGER PRIMARY KEY,
    type_enumere_id INTEGER NOT NULL REFERENCES type_enumere(id) ON DELETE CASCADE,
    valeur          TEXT NOT NULL,             -- code stocké
    libelle         TEXT,                      -- libellé affiché, si différent du code
    ordre           INTEGER,
    UNIQUE (type_enumere_id, valeur)
);

-- -----------------------------------------------------------------------------
--  Grandeur physique — famille d'unités réutilisable entre plusieurs propriétés
--  (ex : "Pression" regroupe les unités bar, Pa, psi...).
-- -----------------------------------------------------------------------------
CREATE TABLE grandeur_physique (
    id          INTEGER PRIMARY KEY,
    nom         TEXT NOT NULL UNIQUE           -- ex "Pression", "Longueur", "Masse"
);

CREATE TABLE unite (
    id              INTEGER PRIMARY KEY,
    grandeur_id     INTEGER NOT NULL REFERENCES grandeur_physique(id) ON DELETE CASCADE,
    symbole         TEXT NOT NULL,             -- ex "bar", "Pa", "mm"
    libelle         TEXT,                      -- libellé affiché, si différent du symbole
    ordre           INTEGER,
    UNIQUE (grandeur_id, symbole)
);

-- -----------------------------------------------------------------------------
--  Objet métier — l'entité (ex : Engineering Item, Vue)
-- -----------------------------------------------------------------------------
CREATE TABLE objet (
    id          INTEGER PRIMARY KEY,
    nom         TEXT NOT NULL UNIQUE,            -- nom métier, pas le nom de table technique
    definition  TEXT,                            -- définition métier (le "sens")
    domaine_id  INTEGER REFERENCES domaine(id) ON DELETE SET NULL,
    classe_id   INTEGER REFERENCES classe_objet(id) ON DELETE SET NULL,
    discipline_id INTEGER REFERENCES discipline(id) ON DELETE SET NULL,
    origine     TEXT,                            -- trace de la conversion : ex "table T_CLI"
    statut      TEXT NOT NULL DEFAULT 'brouillon'
                CHECK (statut IN ('brouillon','valide','obsolete')),
    cree_le     TEXT NOT NULL DEFAULT (datetime('now')),
    maj_le      TEXT
);

-- -----------------------------------------------------------------------------
--  Propriété — définition d'attribut, indépendante de tout objet.
--  Elle est affectée à un ou plusieurs objets via la table applicabilite.
-- -----------------------------------------------------------------------------
CREATE TABLE propriete (
    id              INTEGER PRIMARY KEY,
    nom             TEXT NOT NULL UNIQUE,
    type            TEXT NOT NULL DEFAULT 'texte'
                    CHECK (type IN ('texte','entier','decimal','booleen',
                                    'date','datetime','enum','identifiant','grandeur')),
    multivalue      INTEGER NOT NULL DEFAULT 0 CHECK (multivalue IN (0,1)),
    type_enumere_id INTEGER REFERENCES type_enumere(id) ON DELETE RESTRICT,
    unite_id        INTEGER REFERENCES unite(id) ON DELETE RESTRICT,
    description     TEXT,
    statut          TEXT NOT NULL DEFAULT 'brouillon'
                    CHECK (statut IN ('brouillon','valide','obsolete')),
    cree_le         TEXT NOT NULL DEFAULT (datetime('now')),
    maj_le          TEXT,
    -- un type_enumere est obligatoire si et seulement si type = 'enum' ;
    -- une unite est obligatoire si et seulement si type = 'grandeur'
    CHECK ( (type = 'enum') = (type_enumere_id IS NOT NULL)
            AND (type = 'grandeur') = (unite_id IS NOT NULL) )
);

-- -----------------------------------------------------------------------------
--  Contrainte — règle de validation portée par une PROPRIETE (même logique
--  que multivalue : intrinsèque à la définition, pas à un usage particulier).
--  Une propriété peut porter plusieurs contraintes de nature différente
--  (UNIQUE(propriete_id, type) empêche seulement les doublons du même type).
--  Conçue pour être projetée en SHACL (regex -> sh:pattern, min/max ->
--  sh:minInclusive/maxInclusive) ; le trigger ci-dessous garde-fou le type
--  de contrainte contre le type de valeur de la propriété qu'elle contraint.
-- -----------------------------------------------------------------------------
CREATE TABLE contrainte (
    id            INTEGER PRIMARY KEY,
    propriete_id  INTEGER NOT NULL REFERENCES propriete(id) ON DELETE CASCADE,
    type          TEXT NOT NULL CHECK (type IN ('regex','min','max')),
    valeur        TEXT NOT NULL,
    message       TEXT,                           -- message d'erreur affiché en cas de violation
    severite      TEXT NOT NULL DEFAULT 'violation'
                  CHECK (severite IN ('violation','avertissement')),
    cree_le       TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (propriete_id, type)
);

CREATE TRIGGER trg_contrainte_type_ins
BEFORE INSERT ON contrainte
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Un motif (regex) ne s''applique qu''aux propriétés de type texte ou identifiant')
    WHERE NEW.type = 'regex'
      AND NOT EXISTS (SELECT 1 FROM propriete WHERE id = NEW.propriete_id AND type IN ('texte','identifiant'));
    SELECT RAISE(ABORT, 'Une borne min/max ne s''applique qu''aux propriétés de type entier, decimal ou grandeur')
      WHERE NEW.type IN ('min','max')
      AND NOT EXISTS (SELECT 1 FROM propriete WHERE id = NEW.propriete_id AND type IN ('entier','decimal','grandeur'));
END;

CREATE TRIGGER trg_contrainte_type_upd
BEFORE UPDATE ON contrainte
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Un motif (regex) ne s''applique qu''aux propriétés de type texte ou identifiant')
    WHERE NEW.type = 'regex'
      AND NOT EXISTS (SELECT 1 FROM propriete WHERE id = NEW.propriete_id AND type IN ('texte','identifiant'));
    SELECT RAISE(ABORT, 'Une borne min/max ne s''applique qu''aux propriétés de type entier, decimal ou grandeur')
      WHERE NEW.type IN ('min','max')
      AND NOT EXISTS (SELECT 1 FROM propriete WHERE id = NEW.propriete_id AND type IN ('entier','decimal','grandeur'));
END;

-- -----------------------------------------------------------------------------
--  Applicabilité — affectation d'une propriété à un objet, avec ce qui est
--  contextuel à cet usage précis (obligatoire, discipline). multivalue reste
--  sur propriete car c'est une caractéristique intrinsèque de la propriété.
-- -----------------------------------------------------------------------------
CREATE TABLE applicabilite (
    id              INTEGER PRIMARY KEY,
    objet_id        INTEGER NOT NULL REFERENCES objet(id) ON DELETE CASCADE,
    propriete_id    INTEGER NOT NULL REFERENCES propriete(id) ON DELETE CASCADE,
    obligatoire     INTEGER NOT NULL DEFAULT 0 CHECK (obligatoire IN (0,1)),
    discipline_id   INTEGER REFERENCES discipline(id) ON DELETE SET NULL,
    ordre           INTEGER,
    statut          TEXT NOT NULL DEFAULT 'brouillon'
                    CHECK (statut IN ('brouillon','valide','obsolete')),
    cree_le         TEXT NOT NULL DEFAULT (datetime('now')),
    maj_le          TEXT,
    UNIQUE (objet_id, propriete_id)
);

-- -----------------------------------------------------------------------------
--  Verbe de relation — définition partagée du nom d'une relation (ex :
--  "possède", "est rattaché à"), réutilisable entre plusieurs lignes de
--  RELATION. Même principe que PROPRIETE : un nom de relation n'est pas
--  ressaisi à chaque usage, il est défini une fois et référencé. C'est ce
--  qui permet, à l'export RDF/OWL, de ne déclarer qu'une seule fois la
--  owl:ObjectProperty correspondante au lieu d'une par ligne de relation.
-- -----------------------------------------------------------------------------
CREATE TABLE verbe_relation (
    id          INTEGER PRIMARY KEY,
    nom         TEXT NOT NULL UNIQUE,
    description TEXT
);

-- -----------------------------------------------------------------------------
--  Relation — lien orienté entre deux objets
--    verbe_id    : nom du lien, référence à VERBE_RELATION (facultatif)
--    type        : nature du lien (mappe UML / ArchiMate)
--    card_*      : cardinalités façon UML, lisibles telles quelles
--    role_*      : nom du rôle à chaque bout (facultatif, aide à la relecture)
--  Une généralisation va du plus spécifique (source) vers le plus général
--  (cible) : Objet source "hérite de" / "est un" objet cible.
-- -----------------------------------------------------------------------------
CREATE TABLE relation (
    id          INTEGER PRIMARY KEY,
    verbe_id    INTEGER REFERENCES verbe_relation(id) ON DELETE SET NULL,
    type        TEXT NOT NULL DEFAULT 'association'
                CHECK (type IN ('association','composition','agregation','generalisation')),
    source_id   INTEGER NOT NULL REFERENCES objet(id) ON DELETE CASCADE,
    cible_id    INTEGER NOT NULL REFERENCES objet(id) ON DELETE CASCADE,
    card_source TEXT NOT NULL DEFAULT '1'
                CHECK (card_source IN ('0..1','1','0..*','1..*')),
    card_cible  TEXT NOT NULL DEFAULT '0..*'
                CHECK (card_cible  IN ('0..1','1','0..*','1..*')),
    role_source TEXT,
    role_cible  TEXT,
    description TEXT,
    statut      TEXT NOT NULL DEFAULT 'brouillon'
                CHECK (statut IN ('brouillon','valide','obsolete')),
    cree_le     TEXT NOT NULL DEFAULT (datetime('now')),
    maj_le      TEXT,
    -- une généralisation ne peut pas pointer sur elle-même ; une association réflexive, si
    CHECK (source_id <> cible_id OR type <> 'generalisation')
);

-- -----------------------------------------------------------------------------
--  Lien d'exigence — traçabilité depuis un élément A-Box externe (ex : un
--  processus ARIS) vers une zone précise du T-Box de CE modèle. Le A-Box
--  n'est jamais géré ici (aucune table d'instances) : seule l'IRI de
--  l'élément externe est enregistrée, à côté d'un pointeur vers l'objet, la
--  propriété ou la relation qu'il contraint. Arc exclusif (CHECK) : chaque
--  lien cible exactement UN des trois, jamais plusieurs à la fois.
-- -----------------------------------------------------------------------------
CREATE TABLE lien_exigence (
    id              INTEGER PRIMARY KEY,
    iri_externe     TEXT NOT NULL,
    systeme_externe TEXT NOT NULL,                -- ex : "ARIS"
    objet_id        INTEGER REFERENCES objet(id) ON DELETE CASCADE,
    propriete_id    INTEGER REFERENCES propriete(id) ON DELETE CASCADE,
    relation_id     INTEGER REFERENCES relation(id) ON DELETE CASCADE,
    commentaire     TEXT,
    cree_le         TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK ( (objet_id IS NOT NULL) + (propriete_id IS NOT NULL) + (relation_id IS NOT NULL) = 1 )
);

-- -----------------------------------------------------------------------------
--  Index sur les clés étrangères (non créés automatiquement par SQLite)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_objet_domaine          ON objet(domaine_id);
CREATE INDEX idx_objet_classe           ON objet(classe_id);
CREATE INDEX idx_objet_discipline       ON objet(discipline_id);
CREATE INDEX idx_propriete_type_enumere ON propriete(type_enumere_id);
CREATE INDEX idx_propriete_unite        ON propriete(unite_id);
CREATE INDEX idx_contrainte_propriete   ON contrainte(propriete_id);
CREATE INDEX idx_valeur_enumeree_type   ON valeur_enumeree(type_enumere_id);
CREATE INDEX idx_unite_grandeur         ON unite(grandeur_id);
CREATE INDEX idx_applicabilite_objet    ON applicabilite(objet_id);
CREATE INDEX idx_applicabilite_propriete ON applicabilite(propriete_id);
CREATE INDEX idx_applicabilite_discipline ON applicabilite(discipline_id);
CREATE INDEX idx_relation_source        ON relation(source_id);
CREATE INDEX idx_relation_cible         ON relation(cible_id);
CREATE INDEX idx_relation_verbe         ON relation(verbe_id);
CREATE INDEX idx_lien_exigence_objet    ON lien_exigence(objet_id);
CREATE INDEX idx_lien_exigence_propriete ON lien_exigence(propriete_id);
CREATE INDEX idx_lien_exigence_relation ON lien_exigence(relation_id);

-- -----------------------------------------------------------------------------
--  Horodatage automatique de la dernière modif (un trigger par table : les
--  triggers SQLite sont mono-table, recursive_triggers est OFF par défaut
--  donc pas de boucle malgré l'UPDATE dans l'UPDATE)
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_objet_maj
AFTER UPDATE ON objet
FOR EACH ROW
BEGIN
    UPDATE objet SET maj_le = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_propriete_maj
AFTER UPDATE ON propriete
FOR EACH ROW
BEGIN
    UPDATE propriete SET maj_le = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_applicabilite_maj
AFTER UPDATE ON applicabilite
FOR EACH ROW
BEGIN
    UPDATE applicabilite SET maj_le = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_relation_maj
AFTER UPDATE ON relation
FOR EACH ROW
BEGIN
    UPDATE relation SET maj_le = datetime('now') WHERE id = NEW.id;
END;

-- -----------------------------------------------------------------------------
--  Vues de lecture
-- -----------------------------------------------------------------------------

-- Objets avec leur domaine, leur classe et le nombre de propriétés affectées
CREATE VIEW v_objet AS
SELECT o.id,
       o.nom,
       d.nom               AS domaine,
       c.nom               AS classe,
       disc.code           AS discipline_code,
       disc.nom            AS discipline_nom,
       o.definition,
       o.statut,
       COUNT(a.id)         AS nb_proprietes
FROM objet o
LEFT JOIN domaine       d ON d.id = o.domaine_id
LEFT JOIN classe_objet  c ON c.id = o.classe_id
LEFT JOIN discipline    disc ON disc.id = o.discipline_id
LEFT JOIN applicabilite a ON a.objet_id = o.id
GROUP BY o.id;

-- Relations en lecture naturelle :  Source [card] --nom(type)--> [card] Cible
CREATE VIEW v_relation AS
SELECT r.id,
       s.nom        AS source,
       r.card_source,
       vb.nom       AS relation,
       r.type,
       r.card_cible,
       c.nom        AS cible,
       r.statut
FROM relation r
JOIN objet s ON s.id = r.source_id
JOIN objet c ON c.id = r.cible_id
LEFT JOIN verbe_relation vb ON vb.id = r.verbe_id;

-- Affectations en lecture naturelle : Objet -- propriete (obligatoire, discipline)
CREATE VIEW v_applicabilite AS
SELECT a.id,
       o.nom          AS objet,
       p.nom          AS propriete,
       p.type,
       a.obligatoire,
       p.multivalue,
       gp.nom         AS grandeur,
       u.symbole      AS unite,
       disc.code      AS discipline_code,
       disc.nom       AS discipline_nom,
       a.ordre,
       a.statut
FROM applicabilite a
JOIN objet     o    ON o.id = a.objet_id
JOIN propriete p    ON p.id = a.propriete_id
LEFT JOIN unite u ON u.id = p.unite_id
LEFT JOIN grandeur_physique gp ON gp.id = u.grandeur_id
LEFT JOIN discipline disc ON disc.id = a.discipline_id;

-- Contraintes en lecture naturelle : Propriete -- type (valeur)
CREATE VIEW v_contrainte AS
SELECT c.id,
       p.nom     AS propriete,
       c.type,
       c.valeur,
       c.message,
       c.severite
FROM contrainte c
JOIN propriete p ON p.id = c.propriete_id;

-- Liens d'exigence en lecture naturelle : IRI externe -- cible (objet/propriete/relation)
CREATE VIEW v_lien_exigence AS
SELECT l.id,
       l.iri_externe,
       l.systeme_externe,
       o.nom          AS objet,
       p.nom          AS propriete,
       l.relation_id,
       l.commentaire
FROM lien_exigence l
LEFT JOIN objet     o ON o.id = l.objet_id
LEFT JOIN propriete p ON p.id = l.propriete_id;

-- Propriétés effectives d'un objet : celles qui lui sont affectées directement,
-- + celles héritées de ses ancêtres le long des relations de généralisation
-- (source = spécifique -> cible = général). La classification (classe_objet)
-- n'entre pas en jeu ici : elle ne fait pas hériter de propriétés.
CREATE VIEW v_propriete_effective AS
WITH RECURSIVE ancetres(objet_id, ancetre_id) AS (
    SELECT id, id FROM objet
    UNION
    SELECT a.objet_id, r.cible_id
    FROM ancetres a
    JOIN relation r ON r.source_id = a.ancetre_id AND r.type = 'generalisation'
)
SELECT anc.objet_id,
       o.nom            AS objet,
       p.id             AS propriete_id,
       p.nom            AS propriete,
       p.type,
       p.multivalue,
       gp.nom           AS grandeur,
       u.symbole        AS unite,
       app.obligatoire,
       disc.code        AS discipline_code,
       (anc.objet_id <> anc.ancetre_id) AS heritee,
       oa.nom           AS heritee_de
FROM ancetres anc
JOIN objet          o   ON o.id = anc.objet_id
JOIN objet          oa  ON oa.id = anc.ancetre_id
JOIN applicabilite   app ON app.objet_id = anc.ancetre_id
JOIN propriete       p   ON p.id = app.propriete_id
LEFT JOIN unite u ON u.id = p.unite_id
LEFT JOIN grandeur_physique gp ON gp.id = u.grandeur_id
LEFT JOIN discipline disc ON disc.id = app.discipline_id;
