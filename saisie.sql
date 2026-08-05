-- =============================================================================
--  Vues de saisie — permettent d'insérer (et pour certaines, de modifier) par
--  NOM, sans manipuler d'id à la main.
--  À coller dans l'onglet "Execute SQL" de DB Browser, puis "Write Changes".
--  Ne dépend que du schéma de base (metamodele.sql).
--
--  Tables de référentiel simple (domaine, classe_objet, discipline,
--  type_enumere) : pas de vue dédiée, un INSERT direct suffit puisqu'elles ne
--  résolvent aucune clé étrangère par nom.
-- =============================================================================

-- -----------------------------------------------------------------------------
--  Saisie d'un OBJET (domaine et classe par leur nom, discipline par son CODE).
--  La discipline doit deja exister (comme pour saisie_applicabilite) : sa
--  creation demande un code ET un libelle, que cette vue ne porte pas a elle
--  seule.
-- -----------------------------------------------------------------------------
CREATE VIEW saisie_objet AS
SELECT o.id, o.nom, d.nom AS domaine, c.nom AS classe, disc.code AS discipline, o.definition, o.origine, o.statut
FROM objet o
LEFT JOIN domaine      d ON d.id = o.domaine_id
LEFT JOIN classe_objet c ON c.id = o.classe_id
LEFT JOIN discipline   disc ON disc.id = o.discipline_id;

CREATE TRIGGER trg_saisie_objet_ins
INSTEAD OF INSERT ON saisie_objet
BEGIN
    -- cree le domaine / la classe s'ils n'existent pas encore (silencieux si NEW.domaine/NEW.classe est NULL,
    -- car "OR IGNORE" absorbe aussi la violation NOT NULL sur domaine.nom / classe_objet.nom)
    INSERT OR IGNORE INTO domaine(nom) VALUES (NEW.domaine);
    INSERT OR IGNORE INTO classe_objet(nom) VALUES (NEW.classe);
    SELECT RAISE(ABORT, 'Discipline inconnue')
    WHERE NEW.discipline IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM discipline WHERE code = NEW.discipline);

    INSERT INTO objet(nom, domaine_id, classe_id, discipline_id, definition, origine, statut)
    VALUES (
        NEW.nom,
        (SELECT id FROM domaine      WHERE nom = NEW.domaine),
        (SELECT id FROM classe_objet WHERE nom = NEW.classe),
        (SELECT id FROM discipline   WHERE code = NEW.discipline),
        NEW.definition,
        NEW.origine,
        COALESCE(NEW.statut, 'brouillon')
    );
END;

CREATE TRIGGER trg_saisie_objet_upd
INSTEAD OF UPDATE ON saisie_objet
BEGIN
    SELECT RAISE(ABORT, 'Objet inconnu')
    WHERE NOT EXISTS (SELECT 1 FROM objet WHERE nom = OLD.nom);

    INSERT OR IGNORE INTO domaine(nom) VALUES (NEW.domaine);
    INSERT OR IGNORE INTO classe_objet(nom) VALUES (NEW.classe);
    SELECT RAISE(ABORT, 'Discipline inconnue')
    WHERE NEW.discipline IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM discipline WHERE code = NEW.discipline);

    UPDATE objet
    SET nom           = NEW.nom,
        domaine_id    = (SELECT id FROM domaine      WHERE nom = NEW.domaine),
        classe_id     = (SELECT id FROM classe_objet WHERE nom = NEW.classe),
        discipline_id = (SELECT id FROM discipline   WHERE code = NEW.discipline),
        definition    = NEW.definition,
        origine       = NEW.origine,
        statut        = COALESCE(NEW.statut, statut)
    WHERE nom = OLD.nom;
END;

-- -----------------------------------------------------------------------------
--  Saisie d'une PROPRIÉTÉ — définition partagée, indépendante de tout objet.
--  Créer une propriété ne l'affecte à aucun objet : voir saisie_applicabilite.
--  Modifier une propriété existante (par son nom) répercute le changement
--  partout où elle est déjà affectée.
-- -----------------------------------------------------------------------------
CREATE VIEW saisie_propriete AS
SELECT p.id, p.nom, p.type, p.multivalue, te.nom AS type_enumere,
       gp.nom AS grandeur, u.symbole AS unite, p.description, p.statut
FROM propriete p
LEFT JOIN type_enumere te ON te.id = p.type_enumere_id
LEFT JOIN unite u ON u.id = p.unite_id
LEFT JOIN grandeur_physique gp ON gp.id = u.grandeur_id;

CREATE TRIGGER trg_saisie_propriete_ins
INSTEAD OF INSERT ON saisie_propriete
BEGIN
    SELECT RAISE(ABORT, 'Type énuméré inconnu')
    WHERE NEW.type = 'enum'
      AND NOT EXISTS (SELECT 1 FROM type_enumere WHERE nom = NEW.type_enumere);
    SELECT RAISE(ABORT, 'Unité inconnue pour cette grandeur')
    WHERE NEW.type = 'grandeur'
      AND NOT EXISTS (
          SELECT 1 FROM unite u JOIN grandeur_physique gp ON gp.id = u.grandeur_id
          WHERE gp.nom = NEW.grandeur AND u.symbole = NEW.unite
      );

    INSERT INTO propriete(nom, type, multivalue, type_enumere_id, unite_id, description, statut)
    VALUES (
        NEW.nom,
        COALESCE(NEW.type, 'texte'),
        COALESCE(NEW.multivalue, 0),
        (SELECT id FROM type_enumere WHERE nom = NEW.type_enumere),
        (SELECT u.id FROM unite u JOIN grandeur_physique gp ON gp.id = u.grandeur_id
         WHERE gp.nom = NEW.grandeur AND u.symbole = NEW.unite),
        NEW.description,
        COALESCE(NEW.statut, 'brouillon')
    );
END;

CREATE TRIGGER trg_saisie_propriete_upd
INSTEAD OF UPDATE ON saisie_propriete
BEGIN
    SELECT RAISE(ABORT, 'Propriété inconnue')
    WHERE NOT EXISTS (SELECT 1 FROM propriete WHERE nom = OLD.nom);

    SELECT RAISE(ABORT, 'Type énuméré inconnu')
    WHERE NEW.type = 'enum'
      AND NOT EXISTS (SELECT 1 FROM type_enumere WHERE nom = NEW.type_enumere);
    SELECT RAISE(ABORT, 'Unité inconnue pour cette grandeur')
    WHERE NEW.type = 'grandeur'
      AND NOT EXISTS (
          SELECT 1 FROM unite u JOIN grandeur_physique gp ON gp.id = u.grandeur_id
          WHERE gp.nom = NEW.grandeur AND u.symbole = NEW.unite
      );

    UPDATE propriete
    SET nom             = NEW.nom,
        type            = COALESCE(NEW.type, type),
        multivalue      = COALESCE(NEW.multivalue, multivalue),
        type_enumere_id = (SELECT id FROM type_enumere WHERE nom = NEW.type_enumere),
        unite_id        = (SELECT u.id FROM unite u JOIN grandeur_physique gp ON gp.id = u.grandeur_id
                            WHERE gp.nom = NEW.grandeur AND u.symbole = NEW.unite),
        description     = NEW.description,
        statut          = COALESCE(NEW.statut, statut)
    WHERE nom = OLD.nom;
END;

-- -----------------------------------------------------------------------------
--  Saisie d'une CONTRAINTE, rattachée à une propriété par son NOM. La
--  propriété doit déjà exister (pas d'auto-vivify : une contrainte n'a pas
--  de sens sans la propriété qu'elle valide). Le garde-fou type-vs-type est
--  déjà porté par trg_contrainte_type_ins sur la table sous-jacente.
-- -----------------------------------------------------------------------------
CREATE VIEW saisie_contrainte AS
SELECT c.id, p.nom AS propriete, c.type, c.valeur, c.message, c.severite
FROM contrainte c
JOIN propriete p ON p.id = c.propriete_id;

CREATE TRIGGER trg_saisie_contrainte_ins
INSTEAD OF INSERT ON saisie_contrainte
BEGIN
    SELECT RAISE(ABORT, 'Propriété inconnue')
    WHERE NOT EXISTS (SELECT 1 FROM propriete WHERE nom = NEW.propriete);

    INSERT INTO contrainte(propriete_id, type, valeur, message, severite)
    VALUES (
        (SELECT id FROM propriete WHERE nom = NEW.propriete),
        NEW.type,
        NEW.valeur,
        NEW.message,
        COALESCE(NEW.severite, 'violation')
    );
END;

-- -----------------------------------------------------------------------------
--  Saisie d'une VALEUR ÉNUMÉRÉE, rattachée à un type énuméré par son NOM.
--  Le type énuméré est créé automatiquement s'il n'existe pas encore (pas de
--  champ obligatoire autre que son nom, donc pas de garde-fou nécessaire).
-- -----------------------------------------------------------------------------
CREATE VIEW saisie_valeur_enumeree AS
SELECT v.id, te.nom AS type_enumere, v.valeur, v.libelle, v.ordre
FROM valeur_enumeree v
JOIN type_enumere te ON te.id = v.type_enumere_id;

CREATE TRIGGER trg_saisie_valeur_enumeree_ins
INSTEAD OF INSERT ON saisie_valeur_enumeree
BEGIN
    INSERT OR IGNORE INTO type_enumere(nom) VALUES (NEW.type_enumere);

    INSERT INTO valeur_enumeree(type_enumere_id, valeur, libelle, ordre)
    VALUES (
        (SELECT id FROM type_enumere WHERE nom = NEW.type_enumere),
        NEW.valeur,
        NEW.libelle,
        NEW.ordre
    );
END;

-- -----------------------------------------------------------------------------
--  Saisie d'une UNITÉ, rattachée à une grandeur physique par son NOM.
--  La grandeur est créée automatiquement si elle n'existe pas encore.
-- -----------------------------------------------------------------------------
CREATE VIEW saisie_unite AS
SELECT u.id, gp.nom AS grandeur, u.symbole, u.libelle, u.ordre
FROM unite u
JOIN grandeur_physique gp ON gp.id = u.grandeur_id;

CREATE TRIGGER trg_saisie_unite_ins
INSTEAD OF INSERT ON saisie_unite
BEGIN
    INSERT OR IGNORE INTO grandeur_physique(nom) VALUES (NEW.grandeur);

    INSERT INTO unite(grandeur_id, symbole, libelle, ordre)
    VALUES (
        (SELECT id FROM grandeur_physique WHERE nom = NEW.grandeur),
        NEW.symbole,
        NEW.libelle,
        NEW.ordre
    );
END;

-- -----------------------------------------------------------------------------
--  Saisie d'une APPLICABILITÉ — affecte une propriété existante à un objet
--  existant, avec ce qui est contextuel à cet usage (obligatoire, discipline).
--  La discipline est désignée par son CODE métier (ex "99"), pas son libellé.
-- -----------------------------------------------------------------------------
CREATE VIEW saisie_applicabilite AS
SELECT a.id, o.nom AS objet, p.nom AS propriete, a.obligatoire,
       d.code AS discipline, a.ordre, a.statut
FROM applicabilite a
JOIN objet     o ON o.id = a.objet_id
JOIN propriete p ON p.id = a.propriete_id
LEFT JOIN discipline d ON d.id = a.discipline_id;

CREATE TRIGGER trg_saisie_applicabilite_ins
INSTEAD OF INSERT ON saisie_applicabilite
BEGIN
    SELECT RAISE(ABORT, 'Objet inconnu')
    WHERE NOT EXISTS (SELECT 1 FROM objet WHERE nom = NEW.objet);
    SELECT RAISE(ABORT, 'Propriété inconnue')
    WHERE NOT EXISTS (SELECT 1 FROM propriete WHERE nom = NEW.propriete);
    SELECT RAISE(ABORT, 'Discipline inconnue')
    WHERE NEW.discipline IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM discipline WHERE code = NEW.discipline);

    INSERT INTO applicabilite(objet_id, propriete_id, obligatoire, discipline_id, ordre, statut)
    VALUES (
        (SELECT id FROM objet    WHERE nom  = NEW.objet),
        (SELECT id FROM propriete WHERE nom = NEW.propriete),
        COALESCE(NEW.obligatoire, 0),
        (SELECT id FROM discipline WHERE code = NEW.discipline),
        NEW.ordre,
        COALESCE(NEW.statut, 'brouillon')
    );
END;

CREATE TRIGGER trg_saisie_applicabilite_upd
INSTEAD OF UPDATE ON saisie_applicabilite
BEGIN
    SELECT RAISE(ABORT, 'Affectation inconnue')
    WHERE NOT EXISTS (
        SELECT 1 FROM applicabilite a
        JOIN objet     o ON o.id = a.objet_id
        JOIN propriete p ON p.id = a.propriete_id
        WHERE o.nom = OLD.objet AND p.nom = OLD.propriete
    );
    SELECT RAISE(ABORT, 'Discipline inconnue')
    WHERE NEW.discipline IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM discipline WHERE code = NEW.discipline);

    UPDATE applicabilite
    SET obligatoire   = COALESCE(NEW.obligatoire, obligatoire),
        discipline_id = (SELECT id FROM discipline WHERE code = NEW.discipline),
        ordre         = NEW.ordre,
        statut        = COALESCE(NEW.statut, statut)
    WHERE objet_id     = (SELECT id FROM objet    WHERE nom = OLD.objet)
      AND propriete_id = (SELECT id FROM propriete WHERE nom = OLD.propriete);
END;

-- -----------------------------------------------------------------------------
--  Saisie d'une RELATION entre deux objets, désignés par leur NOM
-- -----------------------------------------------------------------------------
CREATE VIEW saisie_relation AS
SELECT r.id, s.nom AS source, vb.nom AS relation, r.type,
       c.nom AS cible, r.card_source, r.card_cible, r.role_source, r.role_cible,
       r.statut
FROM relation r
JOIN objet s ON s.id = r.source_id
JOIN objet c ON c.id = r.cible_id
LEFT JOIN verbe_relation vb ON vb.id = r.verbe_id;

CREATE TRIGGER trg_saisie_relation_ins
INSTEAD OF INSERT ON saisie_relation
BEGIN
    SELECT RAISE(ABORT, 'Objet source inconnu')
    WHERE NOT EXISTS (SELECT 1 FROM objet WHERE nom = NEW.source);
    SELECT RAISE(ABORT, 'Objet cible inconnu')
    WHERE NOT EXISTS (SELECT 1 FROM objet WHERE nom = NEW.cible);

    -- cree le verbe de relation s'il n'existe pas encore (silencieux si NEW.relation
    -- est NULL, car "OR IGNORE" absorbe aussi la violation NOT NULL sur verbe_relation.nom)
    INSERT OR IGNORE INTO verbe_relation(nom) VALUES (NEW.relation);

    INSERT INTO relation(verbe_id, type, source_id, cible_id,
                         card_source, card_cible, role_source, role_cible, statut)
    VALUES (
        (SELECT id FROM verbe_relation WHERE nom = NEW.relation),
        COALESCE(NEW.type, 'association'),
        (SELECT id FROM objet WHERE nom = NEW.source),
        (SELECT id FROM objet WHERE nom = NEW.cible),
        COALESCE(NEW.card_source, '1'),
        COALESCE(NEW.card_cible, '0..*'),
        NEW.role_source,
        NEW.role_cible,
        COALESCE(NEW.statut, 'brouillon')
    );
END;

-- -----------------------------------------------------------------------------
--  Saisie d'un LIEN D'EXIGENCE depuis un élément externe (IRI, ex : ARIS)
--  vers un OBJET ou une PROPRIETE de ce modèle, désignés par leur NOM.
--  Cible-toi un objet OU une propriete, jamais les deux (porté par le CHECK
--  de la table lien_exigence : renseigner les deux, ou aucun, l'echoue).
--  Le ciblage d'une RELATION n'est pas exposé ici (pas de nom unique pour
--  identifier une relation précise) — la colonne relation_id existe dans
--  le schéma pour un usage futur, à saisir directement en SQL si besoin.
-- -----------------------------------------------------------------------------
CREATE VIEW saisie_lien_exigence AS
SELECT l.id, l.iri_externe, l.systeme_externe, o.nom AS objet, p.nom AS propriete, l.commentaire
FROM lien_exigence l
LEFT JOIN objet     o ON o.id = l.objet_id
LEFT JOIN propriete p ON p.id = l.propriete_id;

CREATE TRIGGER trg_saisie_lien_exigence_ins
INSTEAD OF INSERT ON saisie_lien_exigence
BEGIN
    SELECT RAISE(ABORT, 'Objet inconnu')
    WHERE NEW.objet IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM objet WHERE nom = NEW.objet);
    SELECT RAISE(ABORT, 'Propriété inconnue')
    WHERE NEW.propriete IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM propriete WHERE nom = NEW.propriete);

    INSERT INTO lien_exigence(iri_externe, systeme_externe, objet_id, propriete_id, commentaire)
    VALUES (
        NEW.iri_externe,
        NEW.systeme_externe,
        (SELECT id FROM objet WHERE nom = NEW.objet),
        (SELECT id FROM propriete WHERE nom = NEW.propriete),
        NEW.commentaire
    );
END;
