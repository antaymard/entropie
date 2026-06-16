# Debouncer (composant Convex local)

Debouncing côté serveur pour les opérations coûteuses (appels LLM, recomputations, syncs…) :
plusieurs déclenchements rapprochés sur une même clé ne produisent qu'une seule exécution.

> Vendorisé depuis [`@ikhrustalev/convex-debouncer`](https://github.com/ikhrustalev/convex-debouncer)
> v0.1.2 (Apache-2.0), avec des modifications locales : stratégies `combine`, `maxWait`, `flush()`,
> first-call-wins, typage renforcé. Le composant vit dans `convex/debouncer/`, la classe cliente
> dans `convex/lib/debouncer.ts`.

## Setup

Déjà câblé dans le projet :

```ts
// convex/convex.config.ts
import debouncer from "./debouncer/convex.config";
app.use(debouncer); // → components.debouncer
```

## Quick start

```ts
import { Debouncer } from "../lib/debouncer";
import { components, internal } from "../_generated/api";

const debouncer = new Debouncer(components.debouncer, {
  delay: 5000,        // ms d'inactivité avant exécution
  mode: "sliding",    // "eager" | "fixed" | "sliding"
  // combine: "overwrite",  (défaut)
  // maxWait: 30000,        (optionnel, mode sliding)
});

// Dans une mutation :
export const onUserMessage = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    await debouncer.schedule(ctx, {
      namespace: "ai-response",     // groupe logique
      key: args.threadId,           // identifiant unique dans le namespace
      fn: internal.ia.runAgent,     // fonction cible (mutation ou action internal)
      args: { threadId: args.threadId }, // args de la fonction cible
      // delay / mode / combine / maxWait : overrides optionnels (à plat)
    });
  },
});
```

`ctx` reste le premier argument positionnel ; tout le reste passe dans un objet nommé. Idem pour
`status` / `cancel` / `flush`, qui prennent `(ctx, { namespace, key })`.

Une **session de debounce** = un couple `(namespace, key)` avec un appel en attente. La session se
termine quand la fonction cible s'exécute, ou sur `cancel()` / `flush()`.

⚠️ **First-call-wins** : `mode`, `delay`, `combine` et `maxWait` sont figés par l'appel qui **crée**
la session. Les overrides passés sur les retriggers suivants sont ignorés.

## Modes (timing)

### `sliding` (défaut)

Chaque appel remet le timer à zéro. Exécution après `delay` ms sans nouvel appel.

```
Appel 1 ──▶ timer 5s
   2s ↓
Appel 2 ──▶ timer remis à 5s
   5s sans appel ↓
            Exécution (args combinés)
```

Pour : search-as-you-type, auto-save, "réponds quand l'utilisateur a fini d'écrire".

### `fixed`

Le timer part du premier appel et ne bouge plus. Les appels suivants ne font que combiner les args.

Pour : traitement par lots, APIs rate-limitées, syncs périodiques.

### `eager`

Exécution **immédiate** au premier appel, puis si d'autres appels arrivent pendant `delay`, une
exécution *trailing* avec les args combinés est déclenchée à la fin du timer.

Pour : feedback immédiat + garantie de traiter l'état final.

## `combine` (fusion des args entre retriggers)

| Stratégie | Comportement | La cible reçoit |
|---|---|---|
| `"overwrite"` (défaut) | Le dernier appel écrase tout | `Args` (du dernier appel) |
| `"merge"` | Shallow merge — une clé non re-spécifiée garde sa valeur précédente | `Args` (fusionnés) |
| `"accumulate"` | Tous les appels sont collectés | `{ calls: Args[] }` |

```ts
// merge : chaque appel porte un fragment de l'état final
await debouncer.schedule(ctx, {
  namespace: "autosave", key: docId, fn: internal.docs.save,
  args: { title: "Hello" }, combine: "merge",
});
await debouncer.schedule(ctx, {
  namespace: "autosave", key: docId, fn: internal.docs.save,
  args: { body: "World" }, combine: "merge",
});
// → la cible reçoit { title: "Hello", body: "World" }
```

```ts
// accumulate : chaque appel est un événement, la cible traite le lot.
// La fonction cible DOIT accepter { calls: [...] } :
export const processBatch = internalMutation({
  args: { calls: v.array(v.object({ msg: v.string() })) },
  handler: async (ctx, { calls }) => { /* ... */ },
});

await debouncer.schedule(ctx, {
  namespace: "batch", key, fn: internal.x.processBatch,
  args: { msg: "A" }, combine: "accumulate",
});
await debouncer.schedule(ctx, {
  namespace: "batch", key, fn: internal.x.processBatch,
  args: { msg: "B" }, combine: "accumulate",
});
// → la cible reçoit { calls: [{ msg: "A" }, { msg: "B" }] }
```

Le typage est vérifié : passer `combine: "accumulate"` avec une cible qui n'accepte pas
`{ calls: Args[] }` est une erreur TypeScript.

Notes :

- `merge` est **shallow** : un sous-objet (`{ filters: {...} }`) est remplacé entier, pas fusionné
  en profondeur.
- `eager` + `accumulate` : l'exécution leading reçoit le 1er événement seul (`{ calls: [args1] }`),
  la trailing reçoit les suivants (`{ calls: [args2, ...] }`) — pas de double traitement.
- `eager` + `merge` : la trailing part des args du 1er appel (déjà traités par la leading) et
  fusionne les suivants.

## `maxWait` (mode sliding uniquement)

Sans `maxWait`, un flux continu de retriggers (intervalle < `delay`) repousse l'exécution
indéfiniment. Avec `maxWait`, l'exécution est forcée au plus tard `maxWait` ms après le **premier**
appel de la session :

```ts
const debouncer = new Debouncer(components.debouncer, {
  delay: 5000,
  maxWait: 30000, // exécute au plus tard 30s après le 1er appel, quoi qu'il arrive
});
```

## API

### `new Debouncer(components.debouncer, options)`

`options: { delay: number; mode?: DebouncerMode; combine?: CombineMode; maxWait?: number }` —
valeurs par défaut pour tous les `schedule()` de l'instance.

### `schedule(ctx, params)`

Depuis une **mutation**. `params` :

```ts
{
  namespace: string;
  key: string;
  fn: FunctionReference<"mutation" | "action", "internal">; // cible
  args: object;                  // args de la cible
  // overrides ponctuels (appliqués seulement si cet appel crée la session) :
  delay?: number;
  mode?: DebouncerMode;
  combine?: CombineMode;
  maxWait?: number;
}
```

Retourne `{ executed: boolean, scheduledFor: number }` — `executed: true` uniquement pour le
premier appel en mode `eager` (exécution leading déclenchée).

### `status(ctx, { namespace, key })`

Depuis une query ou mutation. Retourne `null` si rien n'est en attente, sinon
`{ pending, scheduledFor, retriggerCount, mode, combine, hasTrailingCall }`.

### `cancel(ctx, { namespace, key })`

Annule la session en attente sans exécuter. Retourne `true` si quelque chose a été annulé.

### `flush(ctx, { namespace, key })`

Exécute **immédiatement** l'appel en attente et annule le timer. Retourne `true` si une exécution
a été déclenchée (`false` si rien en attente, ou session `eager` sans trailing call — la leading
a déjà tout traité). Typique : l'utilisateur valide explicitement au lieu d'attendre la fin du
debounce.

## Contraintes et caveats

- La fonction cible doit être une **mutation ou action `internal`** dont les args sont un objet
  Convex-sérialisable (passé via `v.any()` en interne, donc pas de validation au schedule —
  l'erreur éventuelle apparaît à l'exécution de la cible).
- L'exécution passe par un **function handle** stocké en base. Si un deploy supprime/renomme la
  fonction cible entre le `schedule` et l'exécution, le run cible échoue à ce moment-là (visible
  dans les logs Convex, non rattrapable par le composant). Risque réel surtout avec des `delay`
  longs.
- L'exécution cible est déclenchée via `ctx.scheduler.runAfter(0, …)` : mutations = exactly-once,
  actions = at-most-once (sémantique Convex standard).
- Une seule session par `(namespace, key)` : les données vivent dans la table `debouncedCalls`
  du composant (invisible du schéma de l'app).
