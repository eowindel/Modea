# Spécification fonctionnelle de Modea

| Fichier | Rôle |
|---|---|
| `modea.specform.json` | **La spec.** S'ouvre dans SpecForm (Ctrl+O) pour la relire, la modifier, l'exporter en PDF, en Markdown ou en Excel |
| `apercu.md` | Rendu Markdown de la spec telle que générée (lecture rapide, différences lisibles dans git) |
| `arbitrages.md` | Ce qui a été retenu, traduit ou écarté du proto, et pourquoi ; questions ouvertes |
| `trace.json` | Pour chaque CU / RB / UX, d'où il vient dans le proto (fonctions, sections du manuel, schéma) |
| `baseline.json` | La spec telle que générée, avant toute retouche à la main : sert à la mise à jour |
| `rapport-maj.md` | Ce qu'a changé la dernière mise à jour (ajouts, fiches à revoir, conflits) |

Établie sur le proto **v0.8.1**, mise à jour pour la **v0.11** (révision 1.1). Aucun choix technologique : le proto est une maquette, pas une architecture.

## Mettre à jour pour une nouvelle version du proto

Avec le skill Claude Code `spec-from-proto` (« mets à jour la spec de Modea pour la v0.12 »).

On part des différences entre la version de `trace.json` et la nouvelle version, et on compare trois états :
`baseline.json` (généré), `modea.specform.json` (retouché) et la nouvelle génération. Une retouche à la main
n'est jamais écrasée sans accord ; les identifiants ne changent pas ; un élément devenu sans objet passe en
obsolète. Les arbitrages déjà faits (`arbitrages.md`) ne sont pas redemandés.
