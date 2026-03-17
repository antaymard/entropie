# Convex Best Practices — Checklist

## Await all Promises

Toujours await les appels à ctx.db, ctx.scheduler, etc. Utiliser la règle ESLint no-floating-promises.

## Éviter .filter sur les queries DB

Remplacer par .withIndex ou .withSearchIndex dès que possible (surtout pour + de 1000 docs). Filtrer en JS seulement pour les petits ensembles.

## Utiliser .collect uniquement sur des résultats bornés

Pour des ensembles potentiellement grands, préférer .paginate, .take(n), ou dénormaliser les données.

## Vérifier les index redondants

Un index by_foo est superflu si by_foo_and_bar existe déjà (car les préfixes suffisent).

## Argument validators sur toutes les fonctions publiques

Toujours déclarer args: { ... } avec les validateurs v.\* pour chaque query, mutation, action.

## Contrôle d'accès sur toutes les fonctions publiques

Vérifier ctx.auth.getUserIdentity(), jamais se fier à un argument spoofable (ex: email). Préférer des fonctions granulaires (setTeamOwner vs updateTeam).

## Ne scheduler/ctx.run\* que des fonctions internal

Utiliser internal.foo.bar au lieu de api.foo.bar dans les schedulers et crons.

## Logique dans des helpers, pas dans les wrappers

La quasi-totalité du code doit vivre dans convex/model/. Les fonctions query/mutation/action doivent être des thin wrappers qui délèguent aux helpers.

## runAction uniquement pour changer de runtime

Ne pas appeler ctx.runAction si la fonction cible tourne dans le même runtime ; appeler directement la fonction TypeScript.

## Éviter les ctx.runMutation/ctx.runQuery séquentiels dans les actions

Les appels séquentiels ne sont pas dans la même transaction. Regrouper dans un seul appel (via un helper) pour garantir la cohérence.

## ctx.runQuery/ctx.runMutation avec parcimonie dans les queries/mutations

Ajouter un overhead inutile. Préférer les fonctions TypeScript simples sauf cas spécifiques (components, rollback partiel).

## Toujours passer le nom de table dans ctx.db

ctx.db.get("movies", id) au lieu de ctx.db.get(id) — requis pour la future custom ID generation.

## Ne pas utiliser Date.now() dans les queries

Invalide le cache Convex de façon excessive. Passer le temps en argument depuis le client (arrondi à la minute), ou mettre à jour un champ booléen via une scheduled function.
