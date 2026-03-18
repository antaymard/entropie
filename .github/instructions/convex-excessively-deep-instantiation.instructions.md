# Concernant les problèmes de "Convex Excessively Deep Instantiation"

## Architecture à suivre

schemas/ — La structure des données. Validateurs Zod et Convex, types TypeScript exportés. Zéro import depuis \_generated. Pas de ctx. C'est le socle que tout le monde importe.
model/ — La logique métier. Des fonctions TypeScript pures qui reçoivent ctx: QueryCtx ou MutationCtx en paramètre. Elles accèdent à ctx.db directement. Seul import type depuis \_generated/server est autorisé (pour les types de contexte). Jamais d'import de api/internal/components.
API publique + interne (canvases.ts, nodeDatas.ts...) — Des wrappers fins. Chaque mutation/query/action fait auth + appelle le model. Ces fichiers ont le droit d'importer api, internal, components car ils exportent des fonctions Convex.
tools/ (closures) — Chaque tool est une factory/closure qui retourne un createTool(...). Le schéma zod et la description sont définis ici. Le handler fait ctx.runQuery/ctx.runMutation avec des refs reçues en paramètre. Aucun import de \_generated/api.
nole.ts / automations.ts — Le point d'assemblage. Ces fichiers exportent des actions Convex, donc ils ont le droit d'importer internal et components. C'est ici qu'on instancie les tools en leur passant les refs : createReadCanvasTool({ getCanvas: internal.ia.helpers... }).
Client React — Consomme l'API publique via api.\*.
La règle d'import est unidirectionnelle : chaque couche ne dépend que des couches au-dessus d'elle. Aucun cycle.

## A éviter

Eviter de passer par anyApi de convex.

## Vérifier

Utiliser yarn convex codegen pour vérifier les erreurs convex.
