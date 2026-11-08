# Modea

Éditeur de modélisation de domaine (HTML autonome + sql.js, SQLite comme source de vérité). Fichier principal : `modea-editeur.html`. Contexte et questions ouvertes : `brief-mdm-claude-code.md`.

## Versions et notes de version (à faire systématiquement, sans attendre qu'on le demande)

Pas de build ni de `package.json` : le badge de version (`#appVersion`) et la fenêtre « Nouveautés » sont alimentés par deux constantes en tête du script de `modea-editeur.html`.

Toute livraison qui change le comportement ou l'apparence met à jour, **dans le même commit** :

1. `CHANGELOG` (tableau JS) : un nouvel objet `{ version:'v0.x', date:'AAAA-MM-JJ', items:[…] }` en tête, des phrases écrites pour l'utilisateur métier (ce qui change pour lui, pas le détail technique). Texte brut : pas de markdown.
2. `APP_VERSION` : le même numéro, et `<meta name="version">` du `<head>` (lu par Porta[b]l Apps, format `x.y.z` sans « v » : `v0.6` → `0.6.0`).
3. Le tag git correspondant, au moment du commit.

Numérotation (versions 0.x) :
- nouvelle fonctionnalité ou changement visible → version mineure (0.6 → 0.7) ;
- correction ou retouche sans nouvelle fonctionnalité → correctif (0.6 → 0.6.1) ;
- plusieurs changements livrés le même jour pour la même demande → un seul bloc de version, complété.

Les changements purement internes (scripts, refactorisation sans effet visible, documentation développeur) ne changent pas la version.

Si le schéma SQLite évolue : incrémenter `SCHEMA_VERSION` dans `modea-editeur.html` ET dans `metamodele.sql`.

## Bibliothèques embarquées (hors-ligne)

Aucun CDN : sql.js, Cytoscape et cytoscape-svg sont dans `vendor/` et injectées en fin de `modea-editeur.html` et `demo-cytoscape.html` (blocs `<script type="text/plain" id="vendor-…">` entre les marqueurs `VENDOR:BEGIN/END`). Ne pas éditer ces blocs à la main : après un changement dans `vendor/`, lancer `python3 scripts/inline_vendor.py`. Ne jamais remettre d'URL `http(s)` pour charger du code.
