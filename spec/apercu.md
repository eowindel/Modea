# Modea — modélisation de domaine

*Spécification applicatif*

| Version | Date | Product Manager | Statut |
| --- | --- | --- | --- |
| 1.1 | 18/11/2026 | — | Brouillon |

*Ce document décrit les règles métier et l'expérience utilisateur attendue. Il ne prescrit aucun choix de technologie.*

## Historique des révisions

| Version | Date | Auteur | Modifications |
| --- | --- | --- | --- |
| 1.0 | 18/11/2026 | — | Première version, établie à partir du prototype Modea v0.8.1. |
| 1.1 | 18/11/2026 | — | Prise en compte du prototype Modea v0.11 : modification des relations, nom technique des relations, couleur des domaines. |

## Sommaire

- [1. Cas d'usage](#1-cas-dusage)
  - [CU-001 — Créer un modèle de domaine](#cu-001--créer-un-modèle-de-domaine)
  - [CU-002 — Ouvrir un modèle existant](#cu-002--ouvrir-un-modèle-existant)
  - [CU-003 — Décrire un objet du domaine](#cu-003--décrire-un-objet-du-domaine)
  - [CU-004 — Définir une propriété partagée](#cu-004--définir-une-propriété-partagée)
  - [CU-005 — Gérer une liste de valeurs](#cu-005--gérer-une-liste-de-valeurs)
  - [CU-006 — Affecter une propriété à un objet](#cu-006--affecter-une-propriété-à-un-objet)
  - [CU-007 — Relier deux objets](#cu-007--relier-deux-objets)
  - [CU-008 — Supprimer un élément du modèle](#cu-008--supprimer-un-élément-du-modèle)
  - [CU-009 — Curer le modèle](#cu-009--curer-le-modèle)
  - [CU-010 — Rechercher et filtrer dans les listes](#cu-010--rechercher-et-filtrer-dans-les-listes)
  - [CU-011 — Explorer le modèle en diagramme](#cu-011--explorer-le-modèle-en-diagramme)
  - [CU-012 — Analyser l'impact d'une propriété ou d'un objet](#cu-012--analyser-limpact-dune-propriété-ou-dun-objet)
  - [CU-013 — Tracer une exigence externe](#cu-013--tracer-une-exigence-externe)
  - [CU-014 — Exporter le modèle aux standards du web sémantique](#cu-014--exporter-le-modèle-aux-standards-du-web-sémantique)
  - [CU-015 — Consulter le modèle sans le modifier](#cu-015--consulter-le-modèle-sans-le-modifier)
  - [CU-016 — Enregistrer une version du modèle](#cu-016--enregistrer-une-version-du-modèle)
  - [CU-017 — Travailler en même temps qu'un collègue](#cu-017--travailler-en-même-temps-quun-collègue)
  - [CU-018 — Être averti d'une nouvelle version et l'intégrer](#cu-018--être-averti-dune-nouvelle-version-et-lintégrer)
  - [CU-019 — Consulter l'historique et restaurer une version](#cu-019--consulter-lhistorique-et-restaurer-une-version)
  - [CU-020 — Poser un jalon](#cu-020--poser-un-jalon)
  - [CU-021 — Reprendre un travail interrompu](#cu-021--reprendre-un-travail-interrompu)
  - [CU-022 — Comparer deux versions du modèle](#cu-022--comparer-deux-versions-du-modèle)
  - [CU-023 — Importer des éléments en masse](#cu-023--importer-des-éléments-en-masse)
  - [CU-024 — Modifier une relation](#cu-024--modifier-une-relation)
- [2. Règles métier](#2-règles-métier)
  - [RB-001 — Unicité des noms](#rb-001--unicité-des-noms)
  - [RB-002 — Une propriété est une définition partagée](#rb-002--une-propriété-est-une-définition-partagée)
  - [RB-003 — Ce qui dépend de l'usage est porté par l'affectation](#rb-003--ce-qui-dépend-de-lusage-est-porté-par-laffectation)
  - [RB-004 — Types de propriété](#rb-004--types-de-propriété)
  - [RB-005 — Propriété de type liste de valeurs](#rb-005--propriété-de-type-liste-de-valeurs)
  - [RB-006 — Propriété de type grandeur physique](#rb-006--propriété-de-type-grandeur-physique)
  - [RB-007 — Contraintes de valeur](#rb-007--contraintes-de-valeur)
  - [RB-008 — Listes de valeurs](#rb-008--listes-de-valeurs)
  - [RB-009 — Disciplines](#rb-009--disciplines)
  - [RB-010 — Création à la volée des référentiels](#rb-010--création-à-la-volée-des-référentiels)
  - [RB-011 — Trois axes de classement d'un objet](#rb-011--trois-axes-de-classement-dun-objet)
  - [RB-012 — Types de relation et sens de lecture](#rb-012--types-de-relation-et-sens-de-lecture)
  - [RB-013 — Cardinalités](#rb-013--cardinalités)
  - [RB-014 — Généralisation non réflexive](#rb-014--généralisation-non-réflexive)
  - [RB-015 — Suppression d'un objet](#rb-015--suppression-dun-objet)
  - [RB-016 — Suppression d'une propriété](#rb-016--suppression-dune-propriété)
  - [RB-017 — Suppression d'un élément de référentiel](#rb-017--suppression-dun-élément-de-référentiel)
  - [RB-018 — Statut de curation](#rb-018--statut-de-curation)
  - [RB-019 — Rôles : lecteur et contributeur](#rb-019--rôles--lecteur-et-contributeur)
  - [RB-020 — Saisie guidée par noms et valeurs autorisées](#rb-020--saisie-guidée-par-noms-et-valeurs-autorisées)
  - [RB-021 — Paramètres des exports sémantiques](#rb-021--paramètres-des-exports-sémantiques)
  - [RB-022 — Correspondance du modèle avec les standards RDF/OWL et SHACL](#rb-022--correspondance-du-modèle-avec-les-standards-rdfowl-et-shacl)
  - [RB-023 — Liens vers un référentiel externe](#rb-023--liens-vers-un-référentiel-externe)
  - [RB-024 — Aucune modification concurrente perdue](#rb-024--aucune-modification-concurrente-perdue)
  - [RB-025 — Élément conservé lors d’un conflit de suppression](#rb-025--élément-conservé-lors-dun-conflit-de-suppression)
  - [RB-026 — Versions identifiées : auteur, date, résumé](#rb-026--versions-identifiées--auteur-date-résumé)
  - [RB-027 — Historique, restauration et jalons](#rb-027--historique-restauration-et-jalons)
  - [RB-028 — Aucune saisie perdue en cas d’interruption](#rb-028--aucune-saisie-perdue-en-cas-dinterruption)
  - [RB-029 — Volumétrie et fluidité](#rb-029--volumétrie-et-fluidité)
  - [RB-030 — Configurations de filtres partagées](#rb-030--configurations-de-filtres-partagées)
  - [RB-031 — Comparaison de deux versions](#rb-031--comparaison-de-deux-versions)
  - [RB-032 — Import en masse par noms](#rb-032--import-en-masse-par-noms)
  - [RB-033 — Nom technique d'une relation](#rb-033--nom-technique-dune-relation)
  - [RB-034 — Modification d'une relation](#rb-034--modification-dune-relation)
- [3. Expérience utilisateur](#3-expérience-utilisateur)
  - [UX-001 — Accueil](#ux-001--accueil)
  - [UX-002 — En-tête](#ux-002--en-tête)
  - [UX-003 — Saisie — Objet](#ux-003--saisie--objet)
  - [UX-004 — Saisie — Propriété](#ux-004--saisie--propriété)
  - [UX-005 — Saisie — Listes de valeurs](#ux-005--saisie--listes-de-valeurs)
  - [UX-006 — Saisie — Affectation](#ux-006--saisie--affectation)
  - [UX-007 — Saisie — Relation](#ux-007--saisie--relation)
  - [UX-008 — Saisie — Lien externe](#ux-008--saisie--lien-externe)
  - [UX-009 — Listes (Fiches)](#ux-009--listes-fiches)
  - [UX-010 — Diagramme](#ux-010--diagramme)
  - [UX-011 — Impact](#ux-011--impact)
  - [UX-012 — Consultation en lecture](#ux-012--consultation-en-lecture)
  - [UX-013 — Arbitrage des conflits](#ux-013--arbitrage-des-conflits)
  - [UX-014 — Bandeau de nouvelle version](#ux-014--bandeau-de-nouvelle-version)
  - [UX-015 — Versions enregistrées](#ux-015--versions-enregistrées)
  - [UX-016 — Confirmations et messages](#ux-016--confirmations-et-messages)
  - [UX-017 — Aide et notes de version](#ux-017--aide-et-notes-de-version)
  - [UX-018 — Comparaison de versions](#ux-018--comparaison-de-versions)
- [4. Matrice de traçabilité](#4-matrice-de-traçabilité)
- [5. Questions ouvertes](#5-questions-ouvertes)
  - [Q-001 — Les noms doivent-ils être distingués selon les majuscules et minuscules ?](#q-001--les-noms-doivent-ils-être-distingués-selon-les-majuscules-et-minuscules-)
  - [Q-002 — Quelle volumétrie viser ?](#q-002--quelle-volumétrie-viser-)
  - [Q-003 — Faut-il un message et une sévérité propres à chaque contrainte de valeur ?](#q-003--faut-il-un-message-et-une-sévérité-propres-à-chaque-contrainte-de-valeur-)
- [6. Glossaire](#6-glossaire)

*24 cas d'usage, 34 règles métier, 18 points UX, 3 questions en suspens.*

## 1. Cas d'usage

### CU-001 — Créer un modèle de domaine

**Acteur** : Contributeur  
**Déclencheur** : « Nouveau modèle »  
**Statut** : Brouillon

#### Flux nominal

1. Le contributeur demande un nouveau modèle
2. Le système crée un modèle vide, prêt à la saisie
3. Le contributeur nomme le modèle à son premier enregistrement

#### Éléments liés

- Règles métier : [RB-001](#rb-001--unicité-des-noms)
- Points UX : [UX-001](#ux-001--accueil), [UX-002](#ux-002--en-tête), [UX-017](#ux-017--aide-et-notes-de-version)

### CU-002 — Ouvrir un modèle existant

**Acteur** : Lecteur ou contributeur  
**Déclencheur** : « Ouvrir »  
**Statut** : Brouillon

#### Flux nominal

1. L’utilisateur choisit un modèle parmi ceux auxquels il a accès
2. Le système charge sa dernière version et affiche les compteurs

#### Gestion des erreurs

- Le modèle n'est pas lisible : un message explique pourquoi, aucun modèle n'est ouvert

#### Éléments liés

- Règles métier : [RB-019](#rb-019--rôles--lecteur-et-contributeur)
- Points UX : [UX-001](#ux-001--accueil), [UX-002](#ux-002--en-tête)

### CU-003 — Décrire un objet du domaine

**Acteur** : Contributeur  
**Déclencheur** : Onglet Objet  
**Statut** : Brouillon

#### Flux nominal

1. Saisir le nom de l'objet
2. Choisir ou taper sa nature, son domaine, sa discipline
3. Rédiger sa définition
4. Valider

#### Flux alternatifs

- Le nom correspond à un objet existant : sa fiche est préchargée et la validation la met à jour
- Nature ou domaine nouveaux : ils sont créés à la volée
- Code de discipline nouveau : son nom est demandé

#### Gestion des erreurs

- Nom vide : refusé

#### Éléments liés

- Règles métier : [RB-001](#rb-001--unicité-des-noms), [RB-009](#rb-009--disciplines), [RB-010](#rb-010--création-à-la-volée-des-référentiels), [RB-011](#rb-011--trois-axes-de-classement-dun-objet), [RB-018](#rb-018--statut-de-curation)
- Points UX : [UX-003](#ux-003--saisie--objet)

### CU-004 — Définir une propriété partagée

**Acteur** : Contributeur  
**Déclencheur** : Onglet Propriété  
**Statut** : Brouillon

#### Flux nominal

1. Saisir le nom de la propriété
2. Choisir son type
3. Compléter les informations propres au type (liste de valeurs, grandeur et unité)
4. Poser éventuellement des contraintes de valeur
5. Indiquer si elle est multivaluée, la décrire
6. Valider

#### Flux alternatifs

- Le nom correspond à une propriété existante : sa définition est préchargée, la modification s’applique partout où elle est affectée

#### Gestion des erreurs

- Type liste de valeurs sans liste, ou type grandeur sans unité : refusé
- Contrainte incompatible avec le type : refusée

#### Éléments liés

- Règles métier : [RB-001](#rb-001--unicité-des-noms), [RB-002](#rb-002--une-propriété-est-une-définition-partagée), [RB-004](#rb-004--types-de-propriété), [RB-005](#rb-005--propriété-de-type-liste-de-valeurs), [RB-006](#rb-006--propriété-de-type-grandeur-physique), [RB-007](#rb-007--contraintes-de-valeur), [RB-010](#rb-010--création-à-la-volée-des-référentiels)
- Points UX : [UX-004](#ux-004--saisie--propriété)

### CU-005 — Gérer une liste de valeurs

**Acteur** : Contributeur  
**Déclencheur** : Onglet Listes de valeurs  
**Statut** : Brouillon

#### Flux nominal

1. Choisir une liste ou taper un nom nouveau
2. Ajouter des valeurs (code, libellé)
3. Supprimer les valeurs devenues inutiles

#### Flux alternatifs

- Supprimer la liste entière, si aucune propriété ne l’utilise

#### Gestion des erreurs

- Code déjà présent dans la liste : refusé
- Liste utilisée : suppression refusée

#### Éléments liés

- Règles métier : [RB-008](#rb-008--listes-de-valeurs), [RB-010](#rb-010--création-à-la-volée-des-référentiels)
- Points UX : [UX-005](#ux-005--saisie--listes-de-valeurs)

### CU-006 — Affecter une propriété à un objet

**Acteur** : Contributeur  
**Déclencheur** : Onglet Affectation, ou « Éditer » sur une propriété affectée  
**Statut** : Brouillon

#### Flux nominal

1. Choisir l'objet
2. Choisir une propriété parmi celles qu’il ne porte pas encore
3. Indiquer si elle est obligatoire et sa discipline
4. Valider

#### Flux alternatifs

- Propriété déjà affectée : son caractère obligatoire et sa discipline sont mis à jour
- Retirer une propriété d’un objet depuis la liste des objets (ligne dépliée)

#### Gestion des erreurs

- Objet ou propriété inconnus : refusé

#### Éléments liés

- Règles métier : [RB-003](#rb-003--ce-qui-dépend-de-lusage-est-porté-par-laffectation), [RB-009](#rb-009--disciplines), [RB-020](#rb-020--saisie-guidée-par-noms-et-valeurs-autorisées)
- Points UX : [UX-006](#ux-006--saisie--affectation), [UX-009](#ux-009--listes-fiches)

### CU-007 — Relier deux objets

**Acteur** : Contributeur  
**Déclencheur** : Onglet Relation  
**Statut** : À revoir

#### Flux nominal

1. Choisir l’objet source et l’objet cible
2. Choisir le type de lien et les cardinalités
3. Nommer la relation (verbe) et lui donner, si besoin, un nom technique
4. Vérifier l’aperçu, valider

#### Gestion des erreurs

- Objet inconnu : refusé
- Généralisation d’un objet vers lui-même : refusée

#### Éléments liés

- Règles métier : [RB-010](#rb-010--création-à-la-volée-des-référentiels), [RB-012](#rb-012--types-de-relation-et-sens-de-lecture), [RB-013](#rb-013--cardinalités), [RB-014](#rb-014--généralisation-non-réflexive), [RB-020](#rb-020--saisie-guidée-par-noms-et-valeurs-autorisées), [RB-033](#rb-033--nom-technique-dune-relation)
- Points UX : [UX-007](#ux-007--saisie--relation)

### CU-008 — Supprimer un élément du modèle

**Acteur** : Contributeur  
**Déclencheur** : « Supprimer » dans une liste  
**Statut** : Brouillon

#### Flux nominal

1. Le contributeur demande la suppression
2. Le système annonce les conséquences (affectations, relations, objets concernés)
3. Le contributeur confirme
4. L’élément et ses dépendants sont retirés

#### Flux alternatifs

- Le contributeur annule : rien ne change

#### Gestion des erreurs

- Élément de référentiel encore utilisé : suppression refusée avec le nombre d’usages

#### Éléments liés

- Règles métier : [RB-008](#rb-008--listes-de-valeurs), [RB-015](#rb-015--suppression-dun-objet), [RB-016](#rb-016--suppression-dune-propriété), [RB-017](#rb-017--suppression-dun-élément-de-référentiel)
- Points UX : [UX-009](#ux-009--listes-fiches), [UX-016](#ux-016--confirmations-et-messages)

### CU-009 — Curer le modèle

**Acteur** : Contributeur  
**Déclencheur** : Relecture du modèle par les experts du domaine  
**Statut** : Brouillon

#### Flux nominal

1. Filtrer les listes sur le statut « brouillon »
2. Relire chaque élément, le corriger si besoin
3. Passer son statut à « validé », ou « obsolète » s’il n’a plus cours

#### Éléments liés

- Règles métier : [RB-018](#rb-018--statut-de-curation), [RB-019](#rb-019--rôles--lecteur-et-contributeur)
- Points UX : [UX-009](#ux-009--listes-fiches), [UX-010](#ux-010--diagramme)

### CU-010 — Rechercher et filtrer dans les listes

**Acteur** : Lecteur ou contributeur  
**Déclencheur** : Vue Fiches  
**Statut** : Brouillon

#### Flux nominal

1. Choisir la liste (objets, propriétés, relations, liens externes, référentiels)
2. Taper un texte et/ou choisir des filtres
3. Déplier une ligne pour voir son détail

#### Flux alternatifs

- Plus de 300 résultats : seuls les 300 premiers sont affichés, avec invitation à affiner

#### Éléments liés

- Règles métier : [RB-029](#rb-029--volumétrie-et-fluidité)
- Points UX : [UX-009](#ux-009--listes-fiches)

### CU-011 — Explorer le modèle en diagramme

**Acteur** : Lecteur ou contributeur  
**Déclencheur** : Vue Diagramme  
**Statut** : Brouillon

#### Flux nominal

1. Le système dessine les objets et leurs relations
2. L’utilisateur cherche et centre un objet
3. Il clique un objet pour en isoler le voisinage et voir son détail
4. Il filtre par nature, domaine ou statut, change de disposition, affiche ou non les propriétés

#### Flux alternatifs

- Enregistrer la combinaison de filtres comme configuration, la réappliquer en un clic
- Passer en plein écran

#### Éléments liés

- Règles métier : [RB-011](#rb-011--trois-axes-de-classement-dun-objet), [RB-012](#rb-012--types-de-relation-et-sens-de-lecture), [RB-029](#rb-029--volumétrie-et-fluidité), [RB-030](#rb-030--configurations-de-filtres-partagées)
- Points UX : [UX-010](#ux-010--diagramme)

### CU-012 — Analyser l'impact d'une propriété ou d'un objet

**Acteur** : Lecteur ou contributeur  
**Déclencheur** : Vue Impact  
**Statut** : Brouillon

#### Flux nominal

1. Rechercher une propriété ou un objet
2. Le sélectionner
3. Régler la profondeur de propagation (1 à 5)
4. Lire les objets ou propriétés touchés

#### Flux alternatifs

- Repérer les propriétés affectées à aucun objet

#### Éléments liés

- Règles métier : [RB-002](#rb-002--une-propriété-est-une-définition-partagée), [RB-003](#rb-003--ce-qui-dépend-de-lusage-est-porté-par-laffectation)
- Points UX : [UX-011](#ux-011--impact)

### CU-013 — Tracer une exigence externe

**Acteur** : Contributeur  
**Déclencheur** : Onglet Lien externe  
**Statut** : Brouillon

#### Flux nominal

1. Saisir l’adresse de l’élément externe et le nom du système
2. Choisir la cible : un objet ou une propriété
3. Commenter, enregistrer

#### Flux alternatifs

- Consulter et supprimer les liens depuis la liste des liens externes

#### Gestion des erreurs

- Adresse, système ou cible manquants : refusé

#### Éléments liés

- Règles métier : [RB-020](#rb-020--saisie-guidée-par-noms-et-valeurs-autorisées), [RB-023](#rb-023--liens-vers-un-référentiel-externe)
- Points UX : [UX-008](#ux-008--saisie--lien-externe), [UX-009](#ux-009--listes-fiches)

### CU-014 — Exporter le modèle aux standards du web sémantique

**Acteur** : Lecteur ou contributeur  
**Déclencheur** : Menu Exporter  
**Statut** : Brouillon

#### Flux nominal

1. Choisir l’export : modèle (RDF/OWL), règles de validation (SHACL) ou liens externes
2. Confirmer ou corriger l’adresse de base proposée
3. Récupérer le fichier produit

#### Gestion des erreurs

- Modèle vide, ou aucun lien externe : export refusé
- Adresse de base invalide : refusée

#### Éléments liés

- Règles métier : [RB-021](#rb-021--paramètres-des-exports-sémantiques), [RB-022](#rb-022--correspondance-du-modèle-avec-les-standards-rdfowl-et-shacl), [RB-023](#rb-023--liens-vers-un-référentiel-externe), [RB-033](#rb-033--nom-technique-dune-relation)
- Points UX : [UX-002](#ux-002--en-tête)

### CU-015 — Consulter le modèle sans le modifier

**Acteur** : Lecteur  
**Déclencheur** : Accès au modèle avec le rôle lecteur  
**Statut** : Brouillon

#### Flux nominal

1. Le lecteur ouvre le modèle
2. Il navigue : recherche, filtres, détail des objets, diagramme, impact
3. Aucune action de modification ne lui est proposée

#### Éléments liés

- Règles métier : [RB-019](#rb-019--rôles--lecteur-et-contributeur)
- Points UX : [UX-010](#ux-010--diagramme), [UX-012](#ux-012--consultation-en-lecture)

### CU-016 — Enregistrer une version du modèle

**Acteur** : Contributeur  
**Déclencheur** : « Enregistrer »  
**Statut** : Brouillon

#### Flux nominal

1. Le contributeur enregistre
2. Le système crée une version datée, à son nom, avec le résumé des changements
3. Les autres contributeurs peuvent la voir

#### Flux alternatifs

- Aucune modification : aucune version créée, un message l’indique
- Un collègue a enregistré entre-temps : voir CU-017

#### Éléments liés

- Règles métier : [RB-019](#rb-019--rôles--lecteur-et-contributeur), [RB-024](#rb-024--aucune-modification-concurrente-perdue), [RB-026](#rb-026--versions-identifiées--auteur-date-résumé)
- Points UX : [UX-002](#ux-002--en-tête), [UX-016](#ux-016--confirmations-et-messages)

### CU-017 — Travailler en même temps qu'un collègue

**Acteur** : Contributeur  
**Déclencheur** : Enregistrement alors qu’une version plus récente existe  
**Statut** : Brouillon

#### Préconditions

Deux contributeurs ont modifié le même modèle depuis la même version.

#### Flux nominal

1. Le système reprend automatiquement tout ce qui ne se chevauche pas
2. Il présente les seuls vrais conflits
3. Le contributeur choisit pour chacun
4. Le système enregistre la version fusionnée

#### Flux alternatifs

- Aucun conflit : la fusion et l’enregistrement se font sans question

#### Gestion des erreurs

- Le contributeur annule l’arbitrage : rien n’est enregistré, son travail reste intact
- Une modification ne peut être reprise sans enfreindre une règle du modèle : elle est signalée comme non reprise

#### Éléments liés

- Règles métier : [RB-024](#rb-024--aucune-modification-concurrente-perdue), [RB-025](#rb-025--élément-conservé-lors-dun-conflit-de-suppression)
- Points UX : [UX-013](#ux-013--arbitrage-des-conflits)
- Questions en suspens : [Q-002](#q-002--quelle-volumétrie-viser-)

### CU-018 — Être averti d'une nouvelle version et l'intégrer

**Acteur** : Contributeur  
**Déclencheur** : Un collègue enregistre une version du modèle ouvert  
**Statut** : Brouillon

#### Flux nominal

1. Un bandeau signale la nouvelle version et son auteur
2. Le contributeur choisit « Intégrer ses modifications »
3. Le système fusionne avec son travail en cours, sans enregistrer

#### Flux alternatifs

- Recharger la dernière version en abandonnant son travail
- Mettre de côté une copie de son travail

#### Éléments liés

- Règles métier : [RB-024](#rb-024--aucune-modification-concurrente-perdue), [RB-025](#rb-025--élément-conservé-lors-dun-conflit-de-suppression)
- Points UX : [UX-013](#ux-013--arbitrage-des-conflits), [UX-014](#ux-014--bandeau-de-nouvelle-version)

### CU-019 — Consulter l'historique et restaurer une version

**Acteur** : Contributeur  
**Déclencheur** : « Versions enregistrées »  
**Statut** : Brouillon

#### Flux nominal

1. Afficher la liste des versions (date, auteur, résumé, jalons)
2. Consulter une version
3. La restaurer si besoin

#### Flux alternatifs

- Consulter sans restaurer : rien ne change dans les versions

#### Éléments liés

- Règles métier : [RB-026](#rb-026--versions-identifiées--auteur-date-résumé), [RB-027](#rb-027--historique-restauration-et-jalons)
- Points UX : [UX-015](#ux-015--versions-enregistrées)

### CU-020 — Poser un jalon

**Acteur** : Contributeur  
**Déclencheur** : Avant une revue ou une diffusion  
**Statut** : Brouillon

#### Flux nominal

1. Saisir le nom du jalon
2. Le système le pose sur la version enregistrée

#### Gestion des erreurs

- Nom de jalon déjà utilisé : refusé

#### Éléments liés

- Règles métier : [RB-027](#rb-027--historique-restauration-et-jalons)
- Points UX : [UX-015](#ux-015--versions-enregistrées)

### CU-021 — Reprendre un travail interrompu

**Acteur** : Contributeur  
**Déclencheur** : Retour après une interruption  
**Statut** : Brouillon

#### Flux nominal

1. Le système propose de restaurer le travail non enregistré (nom du modèle, date)
2. Le contributeur restaure
3. Il retrouve son travail et l’enregistre

#### Flux alternatifs

- Le contributeur ignore : le travail interrompu est abandonné

#### Éléments liés

- Règles métier : [RB-028](#rb-028--aucune-saisie-perdue-en-cas-dinterruption)
- Points UX : [UX-001](#ux-001--accueil)

### CU-022 — Comparer deux versions du modèle

**Acteur** : Lecteur ou contributeur  
**Déclencheur** : Historique des versions  
**Statut** : Brouillon

#### Préconditions

Besoin non prototypé, exprimé lors du cadrage : à confirmer.

#### Flux nominal

1. Choisir deux versions
2. Le système liste les éléments ajoutés, supprimés et modifiés
3. Pour un élément modifié, afficher les valeurs avant / après

#### Éléments liés

- Règles métier : [RB-031](#rb-031--comparaison-de-deux-versions)
- Points UX : [UX-015](#ux-015--versions-enregistrées), [UX-018](#ux-018--comparaison-de-versions)

### CU-023 — Importer des éléments en masse

**Acteur** : Contributeur  
**Déclencheur** : Reprise d’un existant volumineux  
**Statut** : Brouillon

#### Préconditions

Besoin non prototypé, exprimé lors du cadrage : à confirmer.

#### Flux nominal

1. Le contributeur fournit des lignes décrivant objets, propriétés, affectations et relations par leurs noms
2. Le système les importe en brouillon
3. Il signale les lignes rejetées et pourquoi

#### Éléments liés

- Règles métier : [RB-010](#rb-010--création-à-la-volée-des-référentiels), [RB-018](#rb-018--statut-de-curation), [RB-032](#rb-032--import-en-masse-par-noms)
- Points UX : [UX-016](#ux-016--confirmations-et-messages)

### CU-024 — Modifier une relation

**Acteur** : Contributeur  
**Déclencheur** : « Éditer » sur une relation, dans la liste des relations  
**Statut** : Brouillon

#### Flux nominal

1. Le contributeur choisit la relation à modifier
2. Le formulaire de relation se remplit avec ses valeurs actuelles
3. Il change les objets, le type, les cardinalités, le verbe ou le nom technique
4. Il valide : la relation est mise à jour

#### Flux alternatifs

- « Annuler la modification » : rien ne change, le formulaire revient en création

#### Gestion des erreurs

- La relation a été supprimée entre-temps : modification refusée, rien n’est recréé
- Objet inconnu ou généralisation d’un objet vers lui-même : refusé, comme en création

#### Éléments liés

- Règles métier : [RB-034](#rb-034--modification-dune-relation), [RB-012](#rb-012--types-de-relation-et-sens-de-lecture), [RB-013](#rb-013--cardinalités), [RB-014](#rb-014--généralisation-non-réflexive), [RB-033](#rb-033--nom-technique-dune-relation)
- Points UX : [UX-007](#ux-007--saisie--relation), [UX-009](#ux-009--listes-fiches)

## 2. Règles métier

### RB-001 — Unicité des noms

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Dans un modèle, un objet, une propriété, une nature, un domaine, un verbe de relation, une liste de valeurs et une grandeur physique sont identifiés par leur nom, qui est unique dans sa catégorie. Une discipline est identifiée par son code, unique.

#### Contexte

Le nom est ce que l'utilisateur saisit et reconnaît : c'est par lui qu'il désigne un élément, jamais par un identifiant interne.

#### Exemple

Saisir « Moteur » dans le formulaire objet alors qu'un objet « Moteur » existe ouvre sa fiche en modification au lieu d'en créer un second.

#### Validation

Tenter de créer deux propriétés du même nom : la seconde saisie met à jour la première.

#### Éléments liés

- Cas d'usage : [CU-001](#cu-001--créer-un-modèle-de-domaine), [CU-003](#cu-003--décrire-un-objet-du-domaine), [CU-004](#cu-004--définir-une-propriété-partagée)
- Questions en suspens : [Q-001](#q-001--les-noms-doivent-ils-être-distingués-selon-les-majuscules-et-minuscules-)

### RB-002 — Une propriété est une définition partagée

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Une propriété est définie une seule fois (nom, type, caractère multivalué, liste de valeurs ou unité, contraintes, description), indépendamment de tout objet. Elle peut être affectée à autant d'objets que nécessaire. Toute modification de sa définition s'applique partout où elle est affectée.

#### Contexte

Évite les définitions divergentes d'une même notion d'un objet à l'autre.

#### Exemple

Modifier le type de « Numéro de série » le modifie pour les 12 objets qui portent cette propriété.

#### Validation

Modifier une propriété affectée à deux objets, puis vérifier la fiche des deux objets.

#### Éléments liés

- Cas d'usage : [CU-004](#cu-004--définir-une-propriété-partagée), [CU-012](#cu-012--analyser-limpact-dune-propriété-ou-dun-objet)

### RB-003 — Ce qui dépend de l'usage est porté par l'affectation

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Le caractère obligatoire et la discipline sont propres à l'affectation d'une propriété à un objet : une même propriété peut être obligatoire sur un objet et facultative sur un autre. Un objet ne porte qu'une fois une propriété donnée ; affecter de nouveau une propriété déjà affectée met à jour son caractère obligatoire et sa discipline.

#### Exemple

« Masse » est obligatoire pour « Moteur » et facultative pour « Selle ».

#### Validation

Affecter deux fois la même propriété au même objet : une seule affectation subsiste, avec les dernières valeurs.

#### Éléments liés

- Cas d'usage : [CU-006](#cu-006--affecter-une-propriété-à-un-objet), [CU-012](#cu-012--analyser-limpact-dune-propriété-ou-dun-objet)

### RB-004 — Types de propriété

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Une propriété a l'un des types suivants : texte, entier, décimal, booléen, date, date et heure, liste de valeurs, identifiant, grandeur physique. Le caractère multivalué (plusieurs valeurs possibles) est une caractéristique de la propriété elle-même, pas de son usage sur un objet. Le type par défaut est texte.

#### Éléments liés

- Cas d'usage : [CU-004](#cu-004--définir-une-propriété-partagée)

### RB-005 — Propriété de type liste de valeurs

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Une propriété de type « liste de valeurs » est obligatoirement rattachée à une liste de valeurs, et seule une propriété de ce type peut l'être. La liste peut être choisie parmi les existantes ou créée en tapant un nom nouveau.

#### Validation

Créer une propriété de type liste de valeurs sans liste : refusé avec un message explicite.

#### Éléments liés

- Cas d'usage : [CU-004](#cu-004--définir-une-propriété-partagée)

### RB-006 — Propriété de type grandeur physique

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Une propriété de type « grandeur physique » est obligatoirement rattachée à une grandeur (ex. Pression) et à une unité de cette grandeur (ex. bar), et seule une propriété de ce type peut l'être. Grandeurs et unités sont réutilisables entre propriétés ; dans une grandeur, le symbole d'une unité est unique. Une unité peut avoir un libellé distinct de son symbole.

#### Exemple

Grandeur « Pression », unités « bar », « Pa », « psi ».

#### Validation

Créer une propriété de type grandeur sans unité : refusé.

#### Éléments liés

- Cas d'usage : [CU-004](#cu-004--définir-une-propriété-partagée)

### RB-007 — Contraintes de valeur

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Une propriété peut porter des contraintes sur les valeurs admises : un motif attendu pour les types texte et identifiant ; une valeur minimale et/ou maximale pour les types entier, décimal et grandeur physique. Une propriété porte au plus une contrainte de chaque sorte. Une contrainte incompatible avec le type est refusée.

#### Exemple

Numéro de série : motif « \[A-Z\]{2}-\[0-9\]{6} ». Puissance : minimum 0.

#### Validation

Poser un minimum sur une propriété de type texte : refusé avec un message explicite.

#### Éléments liés

- Cas d'usage : [CU-004](#cu-004--définir-une-propriété-partagée)
- Questions en suspens : [Q-003](#q-003--faut-il-un-message-et-une-sévérité-propres-à-chaque-contrainte-de-valeur-)

### RB-008 — Listes de valeurs

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Une liste de valeurs a un nom et des valeurs ordonnées ; chaque valeur a un code, unique dans la liste, et un libellé facultatif. Les valeurs sont rangées dans l'ordre d'ajout. Une liste peut être partagée par plusieurs propriétés. Elle ne peut être supprimée tant qu'une propriété l'utilise ; sa suppression retire ses valeurs.

#### Exemple

Liste « Statut de cycle de vie » : EN\_COURS (En cours), VALIDE (Validé), ARCHIVE (Archivé).

#### Validation

Supprimer une liste utilisée par une propriété : refusé, le nombre de propriétés concernées est indiqué.

#### Éléments liés

- Cas d'usage : [CU-005](#cu-005--gérer-une-liste-de-valeurs), [CU-008](#cu-008--supprimer-un-élément-du-modèle)

### RB-009 — Disciplines

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Une discipline (métier technique concerné) a un code et un nom. Lorsqu'on saisit un code de discipline inconnu, son nom doit aussi être indiqué pour la créer. Une discipline peut qualifier un objet, et aussi l'affectation d'une propriété à un objet.

#### Exemple

« 10 — Mécanique », « 99 — Électricité ».

#### Validation

Saisir un code inconnu sans nom : refusé avec la demande d'indiquer le nom.

#### Éléments liés

- Cas d'usage : [CU-003](#cu-003--décrire-un-objet-du-domaine), [CU-006](#cu-006--affecter-une-propriété-à-un-objet)

### RB-010 — Création à la volée des référentiels

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Nature, domaine, verbe de relation, liste de valeurs, grandeur et unité se créent simplement en tapant un nom qui n'existe pas encore dans le champ correspondant ; un nom existant réutilise l'élément existant. L'utilisateur n'a pas à les déclarer au préalable.

#### Contexte

La saisie doit rester fluide lors de l'initialisation d'un modèle.

#### Éléments liés

- Cas d'usage : [CU-003](#cu-003--décrire-un-objet-du-domaine), [CU-004](#cu-004--définir-une-propriété-partagée), [CU-005](#cu-005--gérer-une-liste-de-valeurs), [CU-007](#cu-007--relier-deux-objets), [CU-023](#cu-023--importer-des-éléments-en-masse)

### RB-011 — Trois axes de classement d'un objet

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Un objet peut être classé selon trois axes indépendants et facultatifs : sa nature (sa forme : Produit, Fiche, Document…), son domaine (regroupement fonctionnel dans l'organisation : Conception, Ventes, Qualité…) et sa discipline. La nature est un classement : deux objets de même nature ne partagent pas leurs propriétés. Le partage de propriétés par héritage passe uniquement par une relation de généralisation.

#### Contexte

Les objets d'une même nature ont en pratique environ 90 % de propriétés distinctes : le modèle est majoritairement en classification, pas en héritage.

#### Éléments liés

- Cas d'usage : [CU-003](#cu-003--décrire-un-objet-du-domaine), [CU-011](#cu-011--explorer-le-modèle-en-diagramme)

### RB-012 — Types de relation et sens de lecture

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Une relation est un lien orienté d'un objet source vers un objet cible, de l'un des types : association (lien simple), composition (la source est le tout, la cible une partie qui n'existe pas sans lui), agrégation (même idée, la partie peut exister sans le tout), généralisation (la source est un cas particulier de la cible : « la source est un(e) cible »). Une relation peut être nommée par un verbe (« contient », « est rattaché à ») ; les verbes forment un vocabulaire partagé, réutilisé d'une relation à l'autre.

#### Exemple

Moto ◆— contient → Moteur (composition). Moto électrique ▷ Moto (généralisation).

#### Éléments liés

- Cas d'usage : [CU-007](#cu-007--relier-deux-objets), [CU-011](#cu-011--explorer-le-modèle-en-diagramme), [CU-024](#cu-024--modifier-une-relation)

### RB-013 — Cardinalités

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Chaque extrémité d'une relation porte une cardinalité parmi 0..1, 1, 0..\* et 1..\*. Par défaut : 1 côté source, 0..\* côté cible. Chaque extrémité peut aussi porter un nom de rôle facultatif.

#### Éléments liés

- Cas d'usage : [CU-007](#cu-007--relier-deux-objets), [CU-024](#cu-024--modifier-une-relation)

### RB-014 — Généralisation non réflexive

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Une généralisation ne peut pas relier un objet à lui-même. Une relation d'un autre type peut relier un objet à lui-même.

#### Validation

Créer une généralisation d'un objet vers lui-même : refusé avec un message explicite.

#### Éléments liés

- Cas d'usage : [CU-007](#cu-007--relier-deux-objets), [CU-024](#cu-024--modifier-une-relation)

### RB-015 — Suppression d'un objet

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Supprimer un objet retire aussi ses affectations de propriétés, les relations dont il est source ou cible, et les liens externes qui le visent. Avant de supprimer, l'utilisateur confirme, après avoir été informé du nombre d'affectations et de relations qui seront retirées.

#### Exemple

« Supprimer « Moteur » ? Cela retirera aussi 6 affectation(s) de propriété et 3 relation(s). »

#### Validation

Supprimer un objet relié : aucune affectation ni relation ne subsiste vers un objet disparu, y compris après enregistrement et réouverture.

#### Éléments liés

- Cas d'usage : [CU-008](#cu-008--supprimer-un-élément-du-modèle)

### RB-016 — Suppression d'une propriété

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Supprimer une propriété la retire de tous les objets qui l'utilisent, ainsi que ses contraintes et les liens externes qui la visent. L'utilisateur confirme après avoir été informé du nombre d'objets concernés.

#### Éléments liés

- Cas d'usage : [CU-008](#cu-008--supprimer-un-élément-du-modèle)

### RB-017 — Suppression d'un élément de référentiel

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Un domaine, une nature, une discipline, un verbe de relation ou une liste de valeurs ne peut être supprimé tant qu'il est utilisé ; le message indique le nombre d'usages. Une grandeur physique ne peut être supprimée tant qu'une propriété utilise l'une de ses unités ; sa suppression retire ses unités.

#### Validation

Supprimer un domaine encore porté par un objet : refusé, avec le nombre d'objets concernés.

#### Éléments liés

- Cas d'usage : [CU-008](#cu-008--supprimer-un-élément-du-modèle)

### RB-018 — Statut de curation

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Objets, propriétés, affectations et relations portent un statut : brouillon, validé ou obsolète. Tout élément créé est en brouillon. Le statut se change directement depuis les listes, sans ouvrir de formulaire.

#### Contexte

Le modèle est initialisé en grande partie par reprise d'existant : le statut pilote la relecture (curation) par les experts du domaine.

#### Éléments liés

- Cas d'usage : [CU-003](#cu-003--décrire-un-objet-du-domaine), [CU-009](#cu-009--curer-le-modèle), [CU-023](#cu-023--importer-des-éléments-en-masse)

### RB-019 — Rôles : lecteur et contributeur

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Deux rôles : le lecteur consulte le modèle (listes, diagramme, impact, exports) sans pouvoir le modifier ; le contributeur peut en plus créer, modifier, supprimer, changer les statuts et enregistrer des versions.

#### Contexte

Le proto n'a pas de gestion des droits : rôle défini lors du cadrage.

#### Éléments liés

- Cas d'usage : [CU-002](#cu-002--ouvrir-un-modèle-existant), [CU-009](#cu-009--curer-le-modèle), [CU-015](#cu-015--consulter-le-modèle-sans-le-modifier), [CU-016](#cu-016--enregistrer-une-version-du-modèle)

### RB-020 — Saisie guidée par noms et valeurs autorisées

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

L'utilisateur désigne toujours les éléments par leur nom (avec suggestions à la saisie), jamais par un identifiant interne. Les champs dont les valeurs sont limitées (type de propriété, type de relation, cardinalité, statut) ne proposent que les valeurs autorisées. Un nom d'objet ou de propriété inconnu est refusé là où un élément existant est attendu (affectation, relation, lien externe).

#### Contexte

Garantit la cohérence du modèle saisi par des non-spécialistes.

#### Validation

Créer une relation vers un objet inexistant : refusé, avec invitation à choisir un nom existant.

#### Éléments liés

- Cas d'usage : [CU-006](#cu-006--affecter-une-propriété-à-un-objet), [CU-007](#cu-007--relier-deux-objets), [CU-013](#cu-013--tracer-une-exigence-externe)

### RB-021 — Paramètres des exports sémantiques

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Chaque export sémantique demande l'adresse de base (IRI) du modèle : elle commence par http:// ou https:// et se termine par \# ou / (un \# est ajouté sinon). Une adresse par défaut est proposée, dérivée du nom du modèle, puis la dernière adresse utilisée. La même adresse doit servir pour les trois exports (modèle, règles de validation, liens externes), régénérés ensemble quand le modèle change. L'export d'un modèle vide, ou des liens externes quand il n'y en a aucun, est refusé.

#### Exemple

http://example.org/modea/moto\# (à remplacer par une adresse réelle avant diffusion).

#### Validation

Saisir une adresse sans http(s) : refusé avec un message.

#### Éléments liés

- Cas d'usage : [CU-014](#cu-014--exporter-le-modèle-aux-standards-du-web-sémantique)

### RB-022 — Correspondance du modèle avec les standards RDF/OWL et SHACL

**Priorité** : Essentielle  
**Statut** : À revoir

#### Énoncé

L'export ontologique (RDF/OWL) traduit : un objet en classe ; une propriété en propriété de données partagée, restreinte sur chaque objet par son affectation (cardinalité selon obligatoire et multivalué) ; une généralisation en sous-classe ; association, composition et agrégation en propriété d'objet avec restriction de cardinalité ; une liste de valeurs en type de données énuméré ; nature, domaine et discipline en schémas de concepts (la nature reste un classement, jamais une sous-classe) ; statut, origine, unité et nom technique des relations en annotations. L'export de règles de validation (SHACL) produit une forme par objet avec les cardinalités des affectations et des relations, et les contraintes de valeur (motif, bornes, valeurs énumérées). Quand un même verbe relie un objet à plusieurs types d'objets, les cardinalités sont comptées séparément pour chaque type visé.

#### Contexte

Interopérabilité avec les outils d'ontologie, sans dépendre de l'outil de modélisation.

#### Validation

Les fichiers produits se chargent sans erreur dans un outil standard ; les règles de validation sont valides ; sur des données d'exemple, les données correctes sont acceptées et les incomplètes rejetées.

#### Éléments liés

- Cas d'usage : [CU-014](#cu-014--exporter-le-modèle-aux-standards-du-web-sémantique)

### RB-023 — Liens vers un référentiel externe

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Un lien externe trace un élément d'un système extérieur (par exemple un processus du référentiel de processus) qui impose une exigence sur une partie du modèle. Il comporte l'adresse (IRI) de l'élément externe et le nom du système, tous deux obligatoires, un commentaire facultatif, et vise exactement un objet ou une propriété du modèle. Le contenu du système externe n'est pas géré dans le modèle.

#### Exemple

Processus ARIS « Valider une nomenclature » → objet « Nomenclature ».

#### Validation

Enregistrer un lien sans système externe : refusé.

#### Éléments liés

- Cas d'usage : [CU-013](#cu-013--tracer-une-exigence-externe), [CU-014](#cu-014--exporter-le-modèle-aux-standards-du-web-sémantique)

### RB-024 — Aucune modification concurrente perdue

**Priorité** : Essentielle  
**Statut** : Brouillon

#### Énoncé

Lorsque plusieurs contributeurs modifient le même modèle en même temps, aucune modification n'est écrasée sans décision explicite. Ce qui ne se chevauche pas est repris automatiquement, y compris des modifications de champs différents d'un même élément. Seuls les vrais conflits sont soumis au contributeur : une même information modifiée différemment des deux côtés ; un élément modifié d'un côté et supprimé de l'autre ; un élément supprimé alors que l'autre s'en sert ; un même élément créé des deux côtés avec des valeurs différentes. Un élément créé à l'identique des deux côtés n'est pas dupliqué.

#### Contexte

Le mécanisme (fusion, verrouillage par élément…) est laissé au choix de la solution ; le besoin est l'absence de perte silencieuse.

#### Exemple

Alice modifie la définition de « Moteur », Bruno son statut : les deux changements sont repris sans question. Si tous deux modifient la définition, le contributeur qui enregistre en second choisit.

#### Validation

Rejouer chaque cas de conflit avec deux contributeurs simultanés.

#### Éléments liés

- Cas d'usage : [CU-016](#cu-016--enregistrer-une-version-du-modèle), [CU-017](#cu-017--travailler-en-même-temps-quun-collègue), [CU-018](#cu-018--être-averti-dune-nouvelle-version-et-lintégrer)

### RB-025 — Élément conservé lors d’un conflit de suppression

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Quand un conflit oppose une suppression à une modification et que le contributeur choisit de conserver l'élément, celui-ci revient avec ses dépendants (affectations, relations) supprimés par la suppression. Si l'arbitrage est annulé, rien n'est enregistré et le travail en cours reste intact.

#### Éléments liés

- Cas d'usage : [CU-017](#cu-017--travailler-en-même-temps-quun-collègue), [CU-018](#cu-018--être-averti-dune-nouvelle-version-et-lintégrer)

### RB-026 — Versions identifiées : auteur, date, résumé

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Chaque enregistrement d'une version partagée du modèle conserve son auteur, sa date et un résumé automatique des changements par catégorie (objets, propriétés, affectations, relations, référentiels… ajoutés, modifiés, supprimés). Enregistrer sans aucune modification ne crée pas de version.

#### Exemple

« 2 objets ajoutés, 1 relation modifiée ».

#### Éléments liés

- Cas d'usage : [CU-016](#cu-016--enregistrer-une-version-du-modèle), [CU-019](#cu-019--consulter-lhistorique-et-restaurer-une-version)

### RB-027 — Historique, restauration et jalons

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Toutes les versions enregistrées restent consultables. Restaurer une ancienne version en fait la version courante sous la forme d'une nouvelle version : l'historique n'est jamais réécrit. Un jalon donne un nom unique à une version (par exemple « v1.0 » avant une revue) ; un nom de jalon déjà utilisé est refusé.

#### Validation

Restaurer une version : l'historique compte une version de plus, la version restaurée est indiquée dans son résumé.

#### Éléments liés

- Cas d'usage : [CU-019](#cu-019--consulter-lhistorique-et-restaurer-une-version), [CU-020](#cu-020--poser-un-jalon)

### RB-028 — Aucune saisie perdue en cas d’interruption

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Un travail en cours non enregistré n'est pas perdu si la session s'interrompt (fermeture, panne). À la reprise, l'utilisateur se voit proposer de restaurer ce travail ou de l'abandonner. Quitter avec des modifications non enregistrées demande confirmation.

#### Contexte

Le proto fait une copie de secours toutes les 5 minutes ; la fréquence et le mécanisme relèvent de la solution.

#### Éléments liés

- Cas d'usage : [CU-021](#cu-021--reprendre-un-travail-interrompu)

### RB-029 — Volumétrie et fluidité

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Les listes restent fluides avec plusieurs milliers d'éléments. Au-delà de 300 résultats, une liste n'affiche que les 300 premiers et invite à affiner la recherche. Le diagramme reste navigable sur un modèle de plusieurs centaines d'objets.

#### Éléments liés

- Cas d'usage : [CU-010](#cu-010--rechercher-et-filtrer-dans-les-listes), [CU-011](#cu-011--explorer-le-modèle-en-diagramme)
- Questions en suspens : [Q-002](#q-002--quelle-volumétrie-viser-)

### RB-030 — Configurations de filtres partagées

**Priorité** : Souhaitable  
**Statut** : Brouillon

#### Énoncé

Une configuration de filtres du diagramme (natures, domaines, statuts cochés) peut être enregistrée sous un nom unique et marquée favorite. Elle fait partie du modèle : tous ceux qui ouvrent le modèle la retrouvent.

#### Éléments liés

- Cas d'usage : [CU-011](#cu-011--explorer-le-modèle-en-diagramme)

### RB-031 — Comparaison de deux versions

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Deux versions d'un même modèle se comparent élément par élément : éléments ajoutés, supprimés, et pour chaque élément modifié, les informations qui ont changé. Un élément garde son identité d'une version à l'autre, même renommé.

#### Éléments liés

- Cas d'usage : [CU-022](#cu-022--comparer-deux-versions-du-modèle)

### RB-032 — Import en masse par noms

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

L'import en masse désigne les éléments par leur nom, comme la saisie : objets, propriétés, affectations et relations. Les noms inconnus là où un élément existant est attendu sont signalés et la ligne n'est pas importée ; les référentiels (nature, domaine…) se créent à la volée comme en saisie. Tout élément importé arrive en brouillon.

#### Éléments liés

- Cas d'usage : [CU-023](#cu-023--importer-des-éléments-en-masse)

### RB-033 — Nom technique d'une relation

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Chaque relation peut porter un nom technique facultatif : un identifiant libre, propre à cette relation (contrairement au verbe, partagé), destiné aux outils qui exploitent le modèle en aval. Les espaces de début et de fin sont retirés ; un nom technique vidé est considéré comme absent. Il est repris dans l'export ontologique et la recherche dans la liste des relations en tient compte.

#### Contexte

Exigence d'interface : les outils en aval identifient les relations par ce nom.

#### Exemple

Local ◆— contient → Équipement, nom technique « REL\_EQUIPEMENT\_LOCAL ».

#### Validation

Saisir un nom technique, exporter le modèle : il figure sur la relation exportée. Le vider : il n'apparaît plus.

#### Éléments liés

- Cas d'usage : [CU-007](#cu-007--relier-deux-objets), [CU-014](#cu-014--exporter-le-modèle-aux-standards-du-web-sémantique), [CU-024](#cu-024--modifier-une-relation)
- Points UX : [UX-007](#ux-007--saisie--relation), [UX-009](#ux-009--listes-fiches)

### RB-034 — Modification d'une relation

**Priorité** : Importante  
**Statut** : Brouillon

#### Énoncé

Une relation existante se modifie sur place : objets source et cible, type, cardinalités, verbe et nom technique. Elle garde son identité (elle n'est ni dupliquée ni recréée), ce qui préserve l'historique et la comparaison des versions. Si la relation a été supprimée pendant qu'on la modifiait, la modification est refusée et rien n'est recréé. Les règles de création s'appliquent (généralisation non réflexive, objets existants).

#### Validation

Modifier une relation : le nombre de relations ne change pas. Supprimer une relation en cours de modification, puis valider : refusé, aucune relation recréée.

#### Éléments liés

- Cas d'usage : [CU-024](#cu-024--modifier-une-relation)
- Points UX : [UX-007](#ux-007--saisie--relation), [UX-009](#ux-009--listes-fiches)

## 3. Expérience utilisateur

### UX-001 — Accueil

**Statut** : Brouillon

Écran affiché tant qu'aucun modèle n'est ouvert : rappel du principe (une propriété se crée une fois puis s'affecte à plusieurs objets) et accès aux modèles.

#### Interactions

- Ouvrir un modèle
- Créer un modèle vierge
- Restaurer ou ignorer un travail interrompu (bandeau)

#### Messages

| Type | Message |
| --- | --- |
| Erreur | Ce modèle n'a pas pu être ouvert : \<raison\>. |
| Avertissement | Une sauvegarde automatique a été trouvée : \<modèle\> — \<date\>. Elle provient d'une session précédente qui n'a pas été enregistrée. |

#### États de l'écran

- Sans travail interrompu
- Avec travail interrompu

#### Éléments liés

- Cas d'usage : [CU-001](#cu-001--créer-un-modèle-de-domaine), [CU-002](#cu-002--ouvrir-un-modèle-existant), [CU-021](#cu-021--reprendre-un-travail-interrompu)

### UX-002 — En-tête

**Statut** : Brouillon

Nom de l'outil et du modèle ouvert, compteurs d'objets, de propriétés, d'affectations et de relations, accès aux actions sur le modèle, aux exports, à l'aide et aux notes de version.

#### Interactions

- Ouvrir
- Nouveau modèle
- Enregistrer
- Exporter (modèle, règles de validation, liens externes)
- Aide
- Notes de version

#### États de l'écran

- Modèle enregistré
- Modifications non enregistrées

#### Éléments liés

- Cas d'usage : [CU-001](#cu-001--créer-un-modèle-de-domaine), [CU-002](#cu-002--ouvrir-un-modèle-existant), [CU-014](#cu-014--exporter-le-modèle-aux-standards-du-web-sémantique), [CU-016](#cu-016--enregistrer-une-version-du-modèle)

### UX-003 — Saisie — Objet

**Statut** : Brouillon

Formulaire : nom, nature, domaine, discipline (code, et nom si le code est nouveau), définition. Les champs proposent les valeurs existantes. Taper le nom d'un objet existant précharge sa fiche ; le bouton devient « Mettre à jour l'objet » et un message l'indique.

#### Interactions

- Suggestions à la saisie
- Entrée valide le formulaire
- Ajouter / Mettre à jour

#### Messages

| Type | Message |
| --- | --- |
| Succès | Objet « \<nom\> » ajouté. / Objet « \<nom\> » mis à jour. |
| Erreur | Donne un nom à l'objet. / Cette discipline n'existe pas — indique aussi son nom pour la créer. |
| Avertissement | Cet objet existe déjà — valider met à jour sa fiche. |

#### États de l'écran

- Création
- Modification

#### Accessibilité

- Navigation au clavier

#### Éléments liés

- Cas d'usage : [CU-003](#cu-003--décrire-un-objet-du-domaine)

### UX-004 — Saisie — Propriété

**Statut** : Brouillon

Formulaire : nom, type, multivaluée, description. Les champs propres au type n'apparaissent que si nécessaire : liste de valeurs (type liste), grandeur, unité et libellé de l'unité (type grandeur, avec rappel des unités existantes), motif (texte, identifiant), minimum et maximum (entier, décimal, grandeur). Taper un nom existant précharge la définition.

#### Interactions

- Choix du type
- Suggestions à la saisie
- Créer / Mettre à jour

#### Messages

| Type | Message |
| --- | --- |
| Succès | Propriété « \<nom\> » créée. / Propriété « \<nom\> » mise à jour — répercutée partout où elle est affectée. |
| Erreur | Choisis (ou crée) une liste de valeurs pour ce type. / Indique la grandeur physique et son unité. |
| Avertissement | Cette propriété existe déjà — valider met à jour sa définition partout où elle est affectée. |

#### États de l'écran

- Création
- Modification

#### Accessibilité

- Navigation au clavier

#### Éléments liés

- Cas d'usage : [CU-004](#cu-004--définir-une-propriété-partagée)

### UX-005 — Saisie — Listes de valeurs

**Statut** : Brouillon

Choisir une liste existante ou taper un nom nouveau ; tableau de ses valeurs (code, libellé, ordre) avec le nombre de propriétés qui l'utilisent ; ajout et suppression de valeurs ; suppression de la liste.

#### Interactions

- Ajouter la valeur
- Supprimer une valeur
- Supprimer cette liste

#### Messages

| Type | Message |
| --- | --- |
| Succès | Valeur ajoutée à « \<liste\> ». |
| Erreur | Cette valeur existe déjà dans cette liste. / Impossible : cette liste est utilisée par \<n\> propriété(s). |

#### États de l'écran

- Aucune liste choisie
- Liste nouvelle (sans valeur)
- Liste avec valeurs

#### Accessibilité

- Navigation au clavier

#### Éléments liés

- Cas d'usage : [CU-005](#cu-005--gérer-une-liste-de-valeurs)

### UX-006 — Saisie — Affectation

**Statut** : Brouillon

Choisir un objet puis une propriété (seules les propriétés pas encore affectées à cet objet sont suggérées), cocher « obligatoire », indiquer la discipline éventuelle.

#### Interactions

- Suggestions filtrées
- Affecter la propriété

#### Messages

| Type | Message |
| --- | --- |
| Succès | Propriété affectée à l'objet. / Affectation mise à jour. |
| Erreur | Objet inconnu — choisis un nom existant dans la liste. |

#### Accessibilité

- Navigation au clavier

#### Éléments liés

- Cas d'usage : [CU-006](#cu-006--affecter-une-propriété-à-un-objet)

### UX-007 — Saisie — Relation

**Statut** : À revoir

Objet source, objet cible, cardinalités, type de lien, nom (verbe) et nom technique facultatif. Un aperçu lisible de la relation se met à jour pendant la saisie : « source \[1\] ── contient ──▶ \[0..\*\] cible ». En modification d'une relation existante, un message l'indique, le bouton devient « Mettre à jour la relation » et « Annuler la modification » apparaît.

#### Interactions

- Suggestions à la saisie
- Aperçu en direct
- Ajouter la relation
- Mettre à jour la relation (en modification)
- Annuler la modification

#### Messages

| Type | Message |
| --- | --- |
| Succès | Relation ajoutée. / Relation mise à jour. |
| Erreur | Choisis deux objets existants (noms exacts). / Une généralisation ne peut pas relier un objet à lui-même. / Cette relation n'existe plus (supprimée entre-temps). |
| Avertissement | Modification d’une relation existante — valider met à jour cette relation. |

#### États de l'écran

- Création
- Modification

#### Éléments liés

- Cas d'usage : [CU-007](#cu-007--relier-deux-objets), [CU-024](#cu-024--modifier-une-relation)
- Règles métier : [RB-033](#rb-033--nom-technique-dune-relation), [RB-034](#rb-034--modification-dune-relation)

### UX-008 — Saisie — Lien externe

**Statut** : Brouillon

Adresse de l'élément externe, système externe, cible (objet ou propriété, le champ correspondant apparaît selon le choix), commentaire.

#### Interactions

- Choix objet / propriété
- Enregistrer le lien

#### Messages

| Type | Message |
| --- | --- |
| Succès | Lien enregistré. |
| Erreur | Donne l'IRI de l'élément externe. / Indique le système externe. |

#### Éléments liés

- Cas d'usage : [CU-013](#cu-013--tracer-une-exigence-externe)

### UX-009 — Listes (Fiches)

**Statut** : À revoir

Listes cherchables des objets, propriétés, relations, liens externes et référentiels (domaines, natures, disciplines, grandeurs, verbes). Recherche texte (pour les relations : objets, verbe et nom technique) et filtres cumulables (nature, domaine, discipline, type, statut). Chaque liste affiche le nombre de résultats. Dans la liste des objets, le domaine s'affiche sur sa couleur de domaine. Une ligne d'objet se déplie sur ses propriétés affectées (avec action « Retirer »), une ligne de propriété sur les objets qui l'utilisent. Le statut s'affiche en pastille colorée et libellée (brouillon or, validé vert, obsolète gris) et se modifie sur place. Une relation se modifie depuis sa ligne (« Éditer »).

#### Interactions

- Recherche
- Filtres
- Déplier une ligne
- Éditer
- Supprimer
- Changer le statut

#### Messages

| Type | Message |
| --- | --- |
| Erreur | Impossible : encore utilisé(e) par \<n\> \<usages\>. |
| Avertissement | 300 affichés sur \<n\> — affine la recherche pour voir le reste. |

#### États de l'écran

- Vide
- Résultats
- Résultats tronqués

#### Éléments liés

- Cas d'usage : [CU-006](#cu-006--affecter-une-propriété-à-un-objet), [CU-008](#cu-008--supprimer-un-élément-du-modèle), [CU-009](#cu-009--curer-le-modèle), [CU-010](#cu-010--rechercher-et-filtrer-dans-les-listes), [CU-013](#cu-013--tracer-une-exigence-externe), [CU-024](#cu-024--modifier-une-relation)
- Règles métier : [RB-033](#rb-033--nom-technique-dune-relation), [RB-034](#rb-034--modification-dune-relation)

### UX-010 — Diagramme

**Statut** : À revoir

Graphe interactif des objets et de leurs relations. Chaque objet affiche son nom, sa nature et son domaine en texte ; la couleur de bordure indique la nature (teintes distinctes même au-delà de 8 natures), le fond pastel le domaine (un objet sans domaine reste sur fond blanc). Chaque domaine garde la même teinte quels que soient les filtres et la vue ; le filtre par domaine montre cette couleur. Flèches : ▷ généralisation, ◆ composition, ◇ agrégation, → association ; ✱ propriété obligatoire. Panneau de détail de l'objet sélectionné.

#### Interactions

- Rechercher et centrer un objet
- Dispositions : force dirigée, hiérarchique, concentrique, cercle, grille
- Réorganiser, ajuster
- Afficher les propriétés (vue détaillée) ou les noms seuls, sans perdre la disposition
- Afficher les noms des relations
- Focus au clic : estomper tout sauf le voisinage de l'objet
- Filtres nature / domaine / statut avec « Tout » et « Aucun »
- Configurations de filtres enregistrées et favorites
- Plein écran

#### Messages

| Type | Message |
| --- | --- |
| Erreur | Plein écran indisponible : \<raison\>. |

#### États de l'écran

- Modèle vide
- Graphe complet
- Graphe filtré
- Focus sur un objet

#### Accessibilité

- Contraste : Nature et domaine lisibles sans la couleur (texte sous le nom) ; fonds pastel assez clairs pour garder le texte lisible

#### Éléments liés

- Cas d'usage : [CU-009](#cu-009--curer-le-modèle), [CU-011](#cu-011--explorer-le-modèle-en-diagramme), [CU-015](#cu-015--consulter-le-modèle-sans-le-modifier)

### UX-011 — Impact

**Statut** : À revoir

Graphe objets ↔ propriétés : un trait relie une propriété à chaque objet qui la porte (plein = obligatoire, pointillé = facultative). Les propriétés affectées à aucun objet sont repérées (contour pointillé). Cliquer un objet ou une propriété met en évidence son voisinage jusqu'à la profondeur choisie (1 à 5) et affiche son détail (propriétés de l'objet, ou objets qui utilisent la propriété). Comme dans le diagramme, la bordure d'un objet indique sa nature et son fond son domaine.

#### Interactions

- Rechercher
- Profondeur 1 à 5
- Focus au clic
- Dispositions
- Plein écran

#### États de l'écran

- Aucune sélection
- Sélection avec voisinage

#### Accessibilité

- Contraste : Nature et domaine lisibles sans la couleur (texte sous le nom) ; fonds pastel assez clairs pour garder le texte lisible

#### Éléments liés

- Cas d'usage : [CU-012](#cu-012--analyser-limpact-dune-propriété-ou-dun-objet)

### UX-012 — Consultation en lecture

**Statut** : À revoir

Pour un lecteur : navigation dans le modèle avec recherche, filtres nature / domaine, panneau de détail d'un objet, sans aucune action de modification. Mêmes repères de couleur que le diagramme (bordure : nature, fond : domaine).

#### Interactions

- Rechercher
- Filtrer
- Voir le détail

#### Accessibilité

- Contraste : Nature et domaine lisibles sans la couleur (texte sous le nom) ; fonds pastel assez clairs pour garder le texte lisible

#### Éléments liés

- Cas d'usage : [CU-015](#cu-015--consulter-le-modèle-sans-le-modifier)

### UX-013 — Arbitrage des conflits

**Statut** : Brouillon

Fenêtre listant les seuls vrais conflits. Pour chacun : l'élément concerné, la nature du conflit, et les deux valeurs (« Ma version » / « Version de \<collègue\> ») à choisir. Raccourcis « Tout : ma version » et « Tout : l'autre version ».

#### Interactions

- Choisir par conflit
- Tout : ma version
- Tout : l'autre version
- Fusionner
- Annuler (ne rien enregistrer)

#### Messages

| Type | Message |
| --- | --- |
| Succès | Modifications de \<collègue\> intégrées à votre travail (\<n\> conflit(s) arbitré(s)). Pensez à enregistrer. |
| Avertissement | \<n\> point(s) non repris lors de la fusion : \<détail\>. |

#### Éléments liés

- Cas d'usage : [CU-017](#cu-017--travailler-en-même-temps-quun-collègue), [CU-018](#cu-018--être-averti-dune-nouvelle-version-et-lintégrer)

### UX-014 — Bandeau de nouvelle version

**Statut** : Brouillon

Bandeau signalant qu'un collègue a enregistré une nouvelle version du modèle ouvert (vérification régulière, environ chaque minute), avec son nom.

#### Interactions

- Intégrer ses modifications
- Télécharger ma version
- Recharger la dernière version

#### Éléments liés

- Cas d'usage : [CU-018](#cu-018--être-averti-dune-nouvelle-version-et-lintégrer)

### UX-015 — Versions enregistrées

**Statut** : Brouillon

Liste des versions du modèle : date, auteur, résumé des changements, jalons. Consulter une version (sans rien modifier), la restaurer, poser un jalon sur la version enregistrée.

#### Interactions

- Consulter
- Restaurer
- Poser le jalon

#### Messages

| Type | Message |
| --- | --- |
| Erreur | Un jalon de ce nom existe déjà. |

#### Éléments liés

- Cas d'usage : [CU-019](#cu-019--consulter-lhistorique-et-restaurer-une-version), [CU-020](#cu-020--poser-un-jalon), [CU-022](#cu-022--comparer-deux-versions-du-modèle)

### UX-016 — Confirmations et messages

**Statut** : Brouillon

Toute suppression est confirmée, avec ses conséquences chiffrées. Les erreurs sont exprimées en langage courant (« Ce nom existe déjà. », « Impossible : cet élément est encore utilisé ailleurs dans le modèle. »), jamais en message technique. Les messages longs restent affichés le temps d'être lus.

#### Interactions

- Confirmer
- Annuler

#### États de l'écran

- Succès
- Erreur

#### Éléments liés

- Cas d'usage : [CU-008](#cu-008--supprimer-un-élément-du-modèle), [CU-016](#cu-016--enregistrer-une-version-du-modèle), [CU-023](#cu-023--importer-des-éléments-en-masse)

### UX-017 — Aide et notes de version

**Statut** : Brouillon

Manuel intégré (concepts, saisie, consultation, travail à plusieurs, astuces) et notes de version de l'outil, accessibles depuis l'en-tête ; Échap ferme les fenêtres.

#### Accessibilité

- Navigation au clavier

#### Éléments liés

- Cas d'usage : [CU-001](#cu-001--créer-un-modèle-de-domaine)

### UX-018 — Comparaison de versions

**Statut** : Brouillon

Vue des différences entre deux versions choisies : éléments ajoutés, supprimés, modifiés, et pour chaque modification l'ancienne et la nouvelle valeur.

#### Éléments liés

- Cas d'usage : [CU-022](#cu-022--comparer-deux-versions-du-modèle)

## 4. Matrice de traçabilité

| Cas d'usage | Intitulé | Règles métier | Points UX | Statut |
| --- | --- | --- | --- | --- |
| [CU-001](#cu-001--créer-un-modèle-de-domaine) | Créer un modèle de domaine | [RB-001](#rb-001--unicité-des-noms) | [UX-001](#ux-001--accueil), [UX-002](#ux-002--en-tête), [UX-017](#ux-017--aide-et-notes-de-version) | Brouillon |
| [CU-002](#cu-002--ouvrir-un-modèle-existant) | Ouvrir un modèle existant | [RB-019](#rb-019--rôles--lecteur-et-contributeur) | [UX-001](#ux-001--accueil), [UX-002](#ux-002--en-tête) | Brouillon |
| [CU-003](#cu-003--décrire-un-objet-du-domaine) | Décrire un objet du domaine | [RB-001](#rb-001--unicité-des-noms), [RB-009](#rb-009--disciplines), [RB-010](#rb-010--création-à-la-volée-des-référentiels), [RB-011](#rb-011--trois-axes-de-classement-dun-objet), [RB-018](#rb-018--statut-de-curation) | [UX-003](#ux-003--saisie--objet) | Brouillon |
| [CU-004](#cu-004--définir-une-propriété-partagée) | Définir une propriété partagée | [RB-001](#rb-001--unicité-des-noms), [RB-002](#rb-002--une-propriété-est-une-définition-partagée), [RB-004](#rb-004--types-de-propriété), [RB-005](#rb-005--propriété-de-type-liste-de-valeurs), [RB-006](#rb-006--propriété-de-type-grandeur-physique), [RB-007](#rb-007--contraintes-de-valeur), [RB-010](#rb-010--création-à-la-volée-des-référentiels) | [UX-004](#ux-004--saisie--propriété) | Brouillon |
| [CU-005](#cu-005--gérer-une-liste-de-valeurs) | Gérer une liste de valeurs | [RB-008](#rb-008--listes-de-valeurs), [RB-010](#rb-010--création-à-la-volée-des-référentiels) | [UX-005](#ux-005--saisie--listes-de-valeurs) | Brouillon |
| [CU-006](#cu-006--affecter-une-propriété-à-un-objet) | Affecter une propriété à un objet | [RB-003](#rb-003--ce-qui-dépend-de-lusage-est-porté-par-laffectation), [RB-009](#rb-009--disciplines), [RB-020](#rb-020--saisie-guidée-par-noms-et-valeurs-autorisées) | [UX-006](#ux-006--saisie--affectation), [UX-009](#ux-009--listes-fiches) | Brouillon |
| [CU-007](#cu-007--relier-deux-objets) | Relier deux objets | [RB-010](#rb-010--création-à-la-volée-des-référentiels), [RB-012](#rb-012--types-de-relation-et-sens-de-lecture), [RB-013](#rb-013--cardinalités), [RB-014](#rb-014--généralisation-non-réflexive), [RB-020](#rb-020--saisie-guidée-par-noms-et-valeurs-autorisées), [RB-033](#rb-033--nom-technique-dune-relation) | [UX-007](#ux-007--saisie--relation) | À revoir |
| [CU-008](#cu-008--supprimer-un-élément-du-modèle) | Supprimer un élément du modèle | [RB-008](#rb-008--listes-de-valeurs), [RB-015](#rb-015--suppression-dun-objet), [RB-016](#rb-016--suppression-dune-propriété), [RB-017](#rb-017--suppression-dun-élément-de-référentiel) | [UX-009](#ux-009--listes-fiches), [UX-016](#ux-016--confirmations-et-messages) | Brouillon |
| [CU-009](#cu-009--curer-le-modèle) | Curer le modèle | [RB-018](#rb-018--statut-de-curation), [RB-019](#rb-019--rôles--lecteur-et-contributeur) | [UX-009](#ux-009--listes-fiches), [UX-010](#ux-010--diagramme) | Brouillon |
| [CU-010](#cu-010--rechercher-et-filtrer-dans-les-listes) | Rechercher et filtrer dans les listes | [RB-029](#rb-029--volumétrie-et-fluidité) | [UX-009](#ux-009--listes-fiches) | Brouillon |
| [CU-011](#cu-011--explorer-le-modèle-en-diagramme) | Explorer le modèle en diagramme | [RB-011](#rb-011--trois-axes-de-classement-dun-objet), [RB-012](#rb-012--types-de-relation-et-sens-de-lecture), [RB-029](#rb-029--volumétrie-et-fluidité), [RB-030](#rb-030--configurations-de-filtres-partagées) | [UX-010](#ux-010--diagramme) | Brouillon |
| [CU-012](#cu-012--analyser-limpact-dune-propriété-ou-dun-objet) | Analyser l'impact d'une propriété ou d'un objet | [RB-002](#rb-002--une-propriété-est-une-définition-partagée), [RB-003](#rb-003--ce-qui-dépend-de-lusage-est-porté-par-laffectation) | [UX-011](#ux-011--impact) | Brouillon |
| [CU-013](#cu-013--tracer-une-exigence-externe) | Tracer une exigence externe | [RB-020](#rb-020--saisie-guidée-par-noms-et-valeurs-autorisées), [RB-023](#rb-023--liens-vers-un-référentiel-externe) | [UX-008](#ux-008--saisie--lien-externe), [UX-009](#ux-009--listes-fiches) | Brouillon |
| [CU-014](#cu-014--exporter-le-modèle-aux-standards-du-web-sémantique) | Exporter le modèle aux standards du web sémantique | [RB-021](#rb-021--paramètres-des-exports-sémantiques), [RB-022](#rb-022--correspondance-du-modèle-avec-les-standards-rdfowl-et-shacl), [RB-023](#rb-023--liens-vers-un-référentiel-externe), [RB-033](#rb-033--nom-technique-dune-relation) | [UX-002](#ux-002--en-tête) | Brouillon |
| [CU-015](#cu-015--consulter-le-modèle-sans-le-modifier) | Consulter le modèle sans le modifier | [RB-019](#rb-019--rôles--lecteur-et-contributeur) | [UX-010](#ux-010--diagramme), [UX-012](#ux-012--consultation-en-lecture) | Brouillon |
| [CU-016](#cu-016--enregistrer-une-version-du-modèle) | Enregistrer une version du modèle | [RB-019](#rb-019--rôles--lecteur-et-contributeur), [RB-024](#rb-024--aucune-modification-concurrente-perdue), [RB-026](#rb-026--versions-identifiées--auteur-date-résumé) | [UX-002](#ux-002--en-tête), [UX-016](#ux-016--confirmations-et-messages) | Brouillon |
| [CU-017](#cu-017--travailler-en-même-temps-quun-collègue) | Travailler en même temps qu'un collègue | [RB-024](#rb-024--aucune-modification-concurrente-perdue), [RB-025](#rb-025--élément-conservé-lors-dun-conflit-de-suppression) | [UX-013](#ux-013--arbitrage-des-conflits) | Brouillon |
| [CU-018](#cu-018--être-averti-dune-nouvelle-version-et-lintégrer) | Être averti d'une nouvelle version et l'intégrer | [RB-024](#rb-024--aucune-modification-concurrente-perdue), [RB-025](#rb-025--élément-conservé-lors-dun-conflit-de-suppression) | [UX-013](#ux-013--arbitrage-des-conflits), [UX-014](#ux-014--bandeau-de-nouvelle-version) | Brouillon |
| [CU-019](#cu-019--consulter-lhistorique-et-restaurer-une-version) | Consulter l'historique et restaurer une version | [RB-026](#rb-026--versions-identifiées--auteur-date-résumé), [RB-027](#rb-027--historique-restauration-et-jalons) | [UX-015](#ux-015--versions-enregistrées) | Brouillon |
| [CU-020](#cu-020--poser-un-jalon) | Poser un jalon | [RB-027](#rb-027--historique-restauration-et-jalons) | [UX-015](#ux-015--versions-enregistrées) | Brouillon |
| [CU-021](#cu-021--reprendre-un-travail-interrompu) | Reprendre un travail interrompu | [RB-028](#rb-028--aucune-saisie-perdue-en-cas-dinterruption) | [UX-001](#ux-001--accueil) | Brouillon |
| [CU-022](#cu-022--comparer-deux-versions-du-modèle) | Comparer deux versions du modèle | [RB-031](#rb-031--comparaison-de-deux-versions) | [UX-015](#ux-015--versions-enregistrées), [UX-018](#ux-018--comparaison-de-versions) | Brouillon |
| [CU-023](#cu-023--importer-des-éléments-en-masse) | Importer des éléments en masse | [RB-010](#rb-010--création-à-la-volée-des-référentiels), [RB-018](#rb-018--statut-de-curation), [RB-032](#rb-032--import-en-masse-par-noms) | [UX-016](#ux-016--confirmations-et-messages) | Brouillon |
| [CU-024](#cu-024--modifier-une-relation) | Modifier une relation | [RB-034](#rb-034--modification-dune-relation), [RB-012](#rb-012--types-de-relation-et-sens-de-lecture), [RB-013](#rb-013--cardinalités), [RB-014](#rb-014--généralisation-non-réflexive), [RB-033](#rb-033--nom-technique-dune-relation) | [UX-007](#ux-007--saisie--relation), [UX-009](#ux-009--listes-fiches) | Brouillon |

### Points à compléter

*Tous les éléments sont reliés entre eux.*

## 5. Questions ouvertes

*Points que la spécification ne tranche pas encore, puis ceux qui ont été tranchés.*

### Q-001 — Les noms doivent-ils être distingués selon les majuscules et minuscules ?

**Statut** : En suspens  
**Concerne** : [RB-001](#rb-001--unicité-des-noms)

#### Contexte

Le prototype considère « Vue » et « vue » comme deux noms différents : deux objets peuvent donc coexister sous ces deux graphies. Une unicité insensible à la casse éviterait les doublons involontaires.

### Q-002 — Quelle volumétrie viser ?

**Statut** : En suspens  
**Concerne** : [CU-017](#cu-017--travailler-en-même-temps-quun-collègue), [RB-029](#rb-029--volumétrie-et-fluidité)

#### Contexte

Nombre de modèles, d'objets par modèle, de contributeurs travaillant en même temps. Le prototype est conçu pour quelques milliers d'éléments par modèle.

### Q-003 — Faut-il un message et une sévérité propres à chaque contrainte de valeur ?

**Statut** : En suspens  
**Concerne** : [RB-007](#rb-007--contraintes-de-valeur)

#### Contexte

Le modèle de données du prototype prévoit, pour chaque contrainte, un message d'erreur et une sévérité (violation ou simple avertissement), mais l'interface ne permet pas de les saisir.

## 6. Glossaire

| Terme | Définition |
| --- | --- |
| **Affectation** | Fait qu'un objet porte une propriété ; précise si elle est obligatoire et dans quelle discipline. |
| **Curation** | Relecture et validation progressive du modèle par les experts du domaine. |
| **Discipline** | Métier technique concerné, identifié par un code. |
| **Domaine** | Regroupement fonctionnel des objets dans l'organisation. |
| **Grandeur physique** | Famille d’unités (Pression : bar, Pa…). |
| **Jalon** | Nom donné à une version du modèle (« v1.0 »). |
| **Lien externe** | Référence à un élément d'un système extérieur qui impose une exigence sur le modèle. |
| **Liste de valeurs** | Ensemble fermé de valeurs admises pour une propriété. |
| **Modèle** | Description d'un domaine : ses objets, leurs propriétés et leurs relations. |
| **Nature** | Forme d'un objet (Produit, Fiche…), servant au classement ; ne transmet aucune propriété. |
| **Nom technique** | Identifiant facultatif d'une relation, propre à elle, utilisé par les outils qui exploitent le modèle. |
| **Objet** | Entité du domaine (Produit, Fiche, Document…). Ce n'est pas une donnée : c'est la description d'un type de données. |
| **Propriété** | Définition d'une caractéristique (nom, type, contraintes), partagée entre les objets qui la portent. |
| **Relation** | Lien orienté entre deux objets : association, composition, agrégation ou généralisation. |
| **Verbe de relation** | Nom partagé d’une relation (« contient »). |

---

*Document généré le 18/11/2026 à 19:33 par SpecForm.*
