# Brief — Modèle de Donnée Métier (MDM)
*Contexte de reprise du projet, à présenter à Claude Code.*

## 1. Objectif

Construire un **modèle de donnée métier** pour l'entreprise. À terme, un outil dédié (Modelio ou ArchiMate) est envisagé, mais le choix n'est pas tranché et prend du temps. En attendant, je veux **initialiser** ce modèle en convertissant un modèle de donnée **applicatif** existant, et disposer d'un support léger pour structurer objets, propriétés et relations.

Domaine concerné : PLM / 3DEXPERIENCE–ENOVIA. Les objets typiques sont des « Engineering Item », « Vue », « Attribut », etc.

## 2. Approche retenue jusqu'ici

- **SQLite comme source unique de vérité**, avec un **métamodèle neutre** de type entité / attribut / relation.
- Principe clé : les tables **décrivent** les objets métier (c'est un métamodèle), elles ne *sont* pas les objets.
- Neutralité volontaire pour pouvoir **projeter** vers UML (Modelio, via XMI) *ou* ArchiMate (ArchiMate Model Exchange Format) sans se fermer de porte.
- La conversion applicatif → métier n'est **pas** 1:1 : les tables/colonnes techniques disparaissent, le vocabulaire est remonté au métier, et la sortie de conversion est un **brouillon à curer**, pas un livrable.

## 3. Le métamodèle actuel — fichier `metamodele.sql`

Tables :
- `domaine` — regroupement fonctionnel.
- `objet` — entité métier : `nom` (unique), `definition`, `domaine_id`, `origine` (trace de la table applicative source), horodatages.
- `propriete` — attribut d'un objet : `objet_id`, `nom`, `type` ∈ {texte, entier, decimal, booleen, date, datetime, enum, identifiant}, `obligatoire`, `multivalue`, `description` ; unicité (objet, nom).
- `relation` — lien orienté : `type` ∈ {association, composition, agregation, generalisation}, `source_id`, `cible_id`, cardinalités `card_source`/`card_cible` ∈ {0..1, 1, 0..*, 1..*}, rôles ; généralisation réflexive interdite.
- Extension adoptée : `classe_objet` + colonne `objet.classe_id`, pour **classer les objets par nature**.

Vues : `v_objet`, `v_relation`, et `v_propriete_effective` (récursive : propriétés propres + héritées le long des généralisations).

Saisie assistée — fichier `saisie.sql` : vues `saisie_objet` / `saisie_propriete` / `saisie_relation` avec triggers `INSTEAD OF` permettant d'insérer **par nom d'objet** (aucun id manipulé à la main), avec garde-fous sur les noms inconnus.

## 4. Décisions de modélisation déjà prises

- Les objets ont des natures différentes avec ~90 % de propriétés distinctes. C'est le **cas normal**, géré nativement par le découpage objet/propriété (chaque objet porte son propre jeu). → on est en **classification**, pas en héritage. `classe_objet` sert au **regroupement par nature** (stéréotype), pas à un mécanisme d'héritage.
- Deux stratégies existent et peuvent coexister : **généralisation** (is-a réel, via `relation type = generalisation`) et **classification** (natures orthogonales). Le projet est majoritairement en classification.
- Socle commun (~10 % des propriétés) : ne pas créer de parent abstrait juste pour factoriser 2–3 propriétés. Les recopier ; ou passer à une table d'**applicabilité** si ce socle commun grossit ou doit être gouverné centralement.

## 5. Outil déjà construit — fichier `mdm-editeur.html`

Éditeur HTML autonome (moteur SQLite `sql.js` dans le navigateur) :
- Saisie par **listes déroulantes** : on choisit l'objet, jamais un id ; les champs contraints (types, cardinalités, types de lien) sont limités aux valeurs autorisées par le schéma.
- Lecture du modèle en direct : vue « fiches » + **diagramme de classes Mermaid** (composition / agrégation / héritage / cardinalités, nature en stéréotype) ; export `.mmd` et `.svg`.
- Sauvegarde du `.db` : réécriture directe du fichier (File System Access sur Chrome/Edge), sinon téléchargement.
- Bibliothèques chargées via CDN, avec option de **vendorisation** pour un fonctionnement 100 % hors-ligne.
- Limite actuelle assumée : **ajout uniquement** (édition / suppression pas encore implémentées).

## 6. Ce que je veux travailler avec toi

Définir la **stratégie applicative** et (re)penser le **modèle de donnée de l'application**. Questions ouvertes :

- **Périmètre** : outil intermédiaire jetable, ou application pérenne ? Si pérenne, jusqu'où (gouvernance, versioning, multi-utilisateur) ?
- **Cible de sortie** : quand et comment générer du Modelio (XMI) et/ou de l'ArchiMate (Model Exchange Format) ? Faut-il formaliser un mapping du métamodèle vers ces cibles dès maintenant ?
- **Modèle de donnée de l'appli** : garder le métamodèle actuel comme noyau ? l'étendre — nomenclatures / listes de valeurs pour le type `enum`, applicabilité de propriétés partagées, versioning / historisation, règles de validation, métadonnées de gouvernance (statut, propriétaire, source) ?
- **Import du modèle applicatif** : quel est le format de la source (schéma SQL, export, autre) et quelle logique de conversion + curation ?
- **Stack** : rester full-client (HTML + sql.js), ou passer à un backend auto-hébergé ? Techno et arguments (portabilité, offline, multi-utilisateur).
- **Curation** : édition / suppression, diff entre versions, filtrage du diagramme par domaine ou par nature.

## 7. Contraintes & préférences

- **Portabilité / pas de lock-in** : le modèle doit rester exportable vers Modelio et ArchiMate ; SQLite comme socle neutre.
- **Fonctionnement hors-ligne** souhaité (habitude d'applications autonomes et self-contained).
- **Auto-hébergement** envisageable (homelab disponible) si un backend se justifie.
- Fichiers de référence à joindre au projet : `metamodele.sql`, `saisie.sql`, `mdm-editeur.html`.
