# Arbitrages : du proto Modea à la spécification fonctionnelle

Ce fichier liste ce qui, dans le proto, a été **retenu comme besoin**, **traduit** (contournement → besoin
sous-jacent) ou **écarté** (choix d'implémentation propre au proto). Il sert à deux choses :

- à la mise à jour de la spec pour une nouvelle version du proto, on ne repose pas les questions déjà tranchées ;
- il explique à la DSI pourquoi un comportement du proto n'apparaît pas dans la spec.

Spec établie sur le proto **v0.8.1** (tag `v0.8.1`), le 2026-11-18. Destinataire : la DSI.

## Décisions de l'auteur du proto

| Réf. | Sujet | Décision | Dans la spec |
|---|---|---|---|
| A-00 | Page autonome, hors ligne, sans serveur | Implémentation propre au proto ; le mode de déploiement est l'affaire de l'entreprise, sans besoin particulier | Rien |
| A-01 | GitLab (enregistrement, versions, fusion, jalons) | Contournement : le proto n'a pas de serveur de données | Besoins retenus : historique et retour arrière, travail simultané sans perte (mécanisme laissé à la DSI), alerte et résumé des changements, auteur et date de chaque version. RB-024 à RB-027, CU-016 à CU-020 |
| A-02 | Exports | Retenus : RDF/OWL et SHACL (normes d'échange), consultation sans modification, liens vers un référentiel externe. **Écarté : export du diagramme en image (PNG, SVG)** | RB-021 à RB-023, CU-013 à CU-015, UX-012 |
| A-03 | Droits | Deux rôles : lecteur, contributeur (tout contributeur peut changer les statuts) | RB-019 |
| A-04 | Besoins du cadrage absents du proto | Retenus, marqués « non prototypé » : import en masse, comparaison de deux versions. **Écartés : import d'un modèle applicatif, export UML / ArchiMate** | CU-022, CU-023, RB-031, RB-032, UX-018 |

## Décisions prises par Claude (à valider)

| Réf. | Élément du proto | Décision proposée | Dans la spec |
|---|---|---|---|
| C-01 | Ouvrir / enregistrer / télécharger une copie d'un fichier modèle | Implémentation. Besoin retenu : plusieurs modèles distincts, que l'on crée et que l'on ouvre | CU-001, CU-002 |
| C-02 | Sauvegarde automatique dans le poste toutes les 5 min, alerte en quittant | Contournement. Besoin : aucune saisie perdue en cas d'interruption | RB-028, CU-021 |
| C-03 | Détection d'un schéma ancien, migration, réparation des orphelins (v0.6.7) | Implémentation et correction d'un défaut du proto. Seule la règle de fond est gardée : une suppression ne laisse rien d'orphelin | RB-015 (validation) |
| C-04 | Identifiant stable de chaque élément | Implémentation. Besoin : un élément garde son identité d'une version à l'autre | RB-031 |
| C-05 | Limite d'affichage de 300 lignes | Gardée comme comportement attendu ; volumétrie cible à préciser | RB-029 |
| C-06 | Bibliothèque de graphe, dispositions (force dirigée, hiérarchique…) | Bibliothèque écartée ; dispositions gardées comme fonctions attendues | UX-010 |
| C-07 | Export du diagramme en page autonome | Traduit en consultation par un lecteur | UX-012, CU-015 |
| C-08 | Message et sévérité des contraintes (modèle de données, sans interface) | Non spécifiés ; signalés en note interne de RB-007 | — |
| C-09 | Champ « origine » d'un objet (trace de la reprise), sans interface | Mentionné seulement dans l'export (annotation) | RB-022 |
| C-10 | Pied de page, logo, notes de version de l'outil | Identité du proto, sauf l'accès à l'aide et aux notes de version | UX-017 |
| C-11 | Relation non modifiable (supprimer puis recréer) | Limite du proto, pas un besoin : non écrite. *La v0.9 du proto ajoute la modification d'une relation.* | — |

## Questions ouvertes pour la DSI

Elles sont dans la spec elle-même (section « Questions ouvertes », Q-001 à Q-003) : casse des noms, volumétrie
cible, message et sévérité des contraintes de valeur.
