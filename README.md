<p align="center"><img src="logo-modea-complet.svg" alt="Modea" height="110"></p>

# Modea

**Décrire ses données métier avec des listes déroulantes, et voir le schéma se dessiner.**

Modea est un éditeur de modèle de donnée métier : on décrit les objets d'un métier, leurs propriétés et leurs liens en choisissant dans des listes, et le diagramme se met à jour en direct. Il tient dans **un seul fichier HTML**, sans serveur, et fonctionne **hors-ligne** : un double-clic suffit.

> Statut : prototype (version courante : **v0.6**, voir les notes de version dans l'outil, en cliquant sur le badge de version).

## Le problème

Mettre à plat les données d'un métier (ses objets, ce qui les décrit, comment ils se relient) se fait souvent dans un tableur, où personne ne voit la structure d'ensemble. Les outils de modélisation dédiés (Modelio, ArchiMate…) sont puissants mais lourds à mettre en place quand il faut simplement *initialiser* un modèle et le faire relire par des métiers.

Modea est né d'un besoin précis : adapter son propre modèle métier tout en gardant sous les yeux les normes de référence.

## Ce que fait Modea

- **Saisie guidée** : on choisit l'objet dans une liste, jamais un identifiant. Les champs contraints (types de propriété, cardinalités, nature des liens) sont limités aux valeurs que le schéma autorise : le modèle reste cohérent.
- **Trois vues** :
  - les **fiches** (objets, propriétés, relations) ;
  - le **diagramme** interactif (Cytoscape), filtrable par nature, domaine et statut, avec des configurations favorites ;
  - l'**analyse d'impact**, de la propriété vers les objets et inversement, à profondeur réglable.
- **Curation** : ajout, édition et suppression ; statut brouillon / validé / obsolète ; détection d'un schéma de base trop ancien.
- **Exports** : modèle en **RDF/OWL** et **SHACL** (Turtle) ; diagramme en **PNG**, **SVG** ou **page HTML autonome** navigable, à partager sans donner accès à l'outil.
- **Hors-ligne et sans lock-in** : le moteur SQLite et la bibliothèque de graphe sont embarqués dans la page ; le modèle est un simple fichier `.db`.

## Démarrer

1. Ouvrir `modea-editeur.html` dans Chrome ou Edge (double-clic).
2. Charger `nouveau-modele.db` (base vierge de référence) ou un modèle existant.
3. Saisir, explorer, puis enregistrer : Chrome et Edge réécrivent directement le fichier `.db`, les autres navigateurs le téléchargent.

Pour travailler sur une copie, `copie-db.bat` (Windows) copie `nouveau-modele.db` en `modea-donnees.db`. Le bouton d'aide de l'outil ouvre le manuel utilisateur.

## Comment ça marche

Le socle est un **métamodèle neutre** dans **SQLite** : les tables *décrivent* les objets métier, elles ne *sont* pas les objets. Cette neutralité permet de projeter le modèle vers UML ou ArchiMate sans se fermer de porte.

| Table | Rôle |
|---|---|
| `domaine` | regroupement fonctionnel |
| `classe_objet` | nature des objets (classification, pas héritage) |
| `objet` | entité métier : nom, définition, domaine, nature, statut |
| `propriete` | attribut d'un objet : type, obligatoire, multivalué, contraintes |
| `relation` | lien orienté : association, composition, agrégation, généralisation, cardinalités, rôles |

Les vues `saisie_objet`, `saisie_propriete` et `saisie_relation` (avec triggers `INSTEAD OF`) permettent d'insérer **par nom** : aucun id manipulé à la main. C'est aussi le chemin d'un import automatisé.

Fichiers utiles :

| Fichier | Contenu |
|---|---|
| `modea-editeur.html` | l'application (page autonome) |
| `metamodele.sql`, `saisie.sql` | schéma et vues de saisie, à garder synchronisés avec le schéma embarqué dans l'éditeur |
| `demo-cytoscape.html` | démonstrateur de graphe, ouvre un `.db` en lecture |
| `scripts/` | `generate_sample_db.py` (base d'exemple), `validate_schema.py`, `inline_vendor.py` |
| `vendor/` | sql.js, Cytoscape et cytoscape-svg, injectés dans les pages par `inline_vendor.py` |
| `brief-mdm-claude-code.md` | contexte du projet et questions ouvertes |

## Développement

- Pas de build : on édite directement `modea-editeur.html`.
- Après un changement dans `vendor/` : `python3 scripts/inline_vendor.py`.
- Chaque évolution visible met à jour, dans le même commit, `CHANGELOG` et `APP_VERSION` (en tête du script), `<meta name="version">`, et crée le tag git. Voir `CLAUDE.md`.
- Évolution du schéma : incrémenter `SCHEMA_VERSION` dans l'éditeur **et** dans `metamodele.sql`.

## Licence

MIT, voir [LICENSE](LICENSE).
