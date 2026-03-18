# Due Diligence : Editeurs Rich Text avec Collaboration Live + Convex

## Contexte

Comparaison approfondie des librairies d'édition rich text pour un projet utilisant Convex en backend. L'objectif est d'identifier la meilleure stack pour un éditeur collaboratif en temps réel avec des besoins spécifiques : mentions, blocs custom, conversion Markdown, rendu read-only performant, et UI riche.

---

## 1. Vue d'ensemble des options

### Les frameworks "bas niveau"

| | TipTap (ProseMirror) | Slate.js | Lexical (Meta) |
|---|---|---|---|
| **Stars GitHub** | ~28k (ProseMirror inclus) | 31.4k | 22.5k |
| **Downloads npm/semaine** | ~5.4M (@tiptap) | ~1.7M | ~1.36M |
| **Version** | 2.x (stable) | 0.x (beta, pas de 1.0 prévue) | 0.x (pre-1.0) |
| **Mainteneur** | TipTap GmbH (commercial) | Communauté (bénévole) | Meta |
| **Fondation** | ProseMirror (mature, 10+ ans) | Architecture custom | Architecture custom |
| **Licence** | MIT | MIT | MIT |

### Les wrappers "batteries incluses"

| | PlateJS (sur Slate) | BlockNote (sur TipTap) |
|---|---|---|
| **Stars GitHub** | ~13k | ~9.2k |
| **Downloads npm/semaine** | ~75k | ~30k |
| **Version** | v29 (très actif) | Stable |
| **UI incluse** | Oui, Radix-based, complète | Oui, Notion-like, polished |
| **Licence** | MIT (core) + Pro payant | MPL-2.0 |

---

## 2. Le critere decisif : integration Convex pour la collaboration

C'est le point le plus structurant. Convex a developpe un composant officiel qui change la donne.

### `@convex-dev/prosemirror-sync` : la solution native Convex

Convex maintient un composant officiel de synchronisation collaborative pour **tout editeur base sur ProseMirror** (donc TipTap et BlockNote).

**Ce que ca fait :**
- Synchronisation en temps reel via OT (Operational Transformations), pas CRDT
- Les edits sont autorises cote serveur (pas de pair-a-pair anarchique)
- Snapshots debounces pour que les nouveaux clients n'aient pas a rejouer tout l'historique
- Transformation de documents cote serveur (permet l'integration AI)
- Hooks React fournis : `useTiptapSync` / `useBlockNoteSync`
- Gestion de l'autorisation lecture/ecriture cote serveur

**Ce que ca ne fait PAS (encore) :**
- Curseurs collaboratifs en temps reel (awareness/presence) -- il faudrait une couche supplementaire
- Gestion des commentaires inline

**Consequence directe** : TipTap et BlockNote ont un avantage structurel massif car ils sont bases sur ProseMirror et donc compatibles nativement avec ce composant. Slate et Lexical n'ont PAS d'equivalent Convex.

### Alternatives pour la collaboration

| Approche | Compatible avec | Complexite | Cout |
|---|---|---|---|
| **prosemirror-sync (Convex natif)** | TipTap, BlockNote | Faible | Gratuit (open source) |
| **Liveblocks** | TipTap, Lexical, BlockNote | Moyenne | Freemium (500 rooms gratuites, puis payant) |
| **PartyKit (Cloudflare)** | Tout via Yjs | Moyenne-haute | Gratuit (tier genereux) |
| **Hocuspocus self-hosted** | TipTap, PlateJS | Haute | Gratuit mais infra a gerer |
| **Yjs custom sur Convex** | Tout | Tres haute | Gratuit mais beaucoup de dev |
| **Automerge + Convex** | Tout | Haute | Gratuit, local-first |

---

## 3. Analyse critere par critere

### 3.1 Mentions (personnes + documents)

| | Support | Qualite |
|---|---|---|
| **TipTap** | Natif (`@tiptap/extension-mention`), UI accessible incluse | Excellent |
| **BlockNote** | Via TipTap, integration directe | Tres bon |
| **PlateJS** | Natif (`MentionKit`), UI incluse | Tres bon |
| **Lexical** | Pas natif, lib tierce (`lexical-beautiful-mentions`) | Correct |
| **Slate nu** | Pas natif, a construire soi-meme | Faible |

**Verdict** : TipTap/BlockNote et PlateJS sont au coude-a-coude. Lexical est en retrait.

### 3.2 Blocs custom

| | Approche | Difficulte |
|---|---|---|
| **TipTap** | `Node.create()` + NodeViews (React components) | Facile-moderee |
| **BlockNote** | API de blocs custom au-dessus de TipTap | Facile |
| **PlateJS** | Plugins + composants Radix | Facile |
| **Lexical** | `DecoratorNode` pour React, `ElementNode` pour structure | Moderee (lifecycle a comprendre) |
| **Slate** | `renderElement` switch | Facile mais verbose |

**Verdict** : Tous sont capables. BlockNote est le plus simple pour du Notion-like. Lexical demande plus de travail.

### 3.3 Conversion Format natif <-> Markdown

| | JSON -> Markdown | Markdown -> JSON | Qualite |
|---|---|---|---|
| **TipTap** | `@tiptap/static-renderer`, extension Markdown | Oui | Bon (certains edge cases en early release) |
| **BlockNote** | Via TipTap sous le capot | Via TipTap | Bon |
| **PlateJS** | `@platejs/markdown` (bidirectionnel) | Oui, CommonMark + GFM | Tres bon |
| **Lexical** | `@lexical/markdown` (`$convertToMarkdownString`) | `$convertFromMarkdownString` | Correct (basique, listes imbriquees limitees) |
| **Slate** | `remark-slate` (communaute) | Oui | Correct |

**Verdict** : PlateJS a la meilleure solution Markdown. TipTap/BlockNote sont solides. Lexical est le plus limite.

### 3.4 Rendu read-only performant (beaucoup de docs sur un canvas)

C'est un critere critique pour ton use case.

| | Mode read-only | Optimisation masse | SSR/Static |
|---|---|---|---|
| **TipTap** | `editable: false`, instances legeres | Isolation de composants React necessaire | Static renderer disponible |
| **BlockNote** | Herite de TipTap | Meme contraintes | Via TipTap |
| **PlateJS** | **`PlateStatic`** : composant dedie, memoisation par noeud, evite la logique d'edition | Tres bon pour du SSR/RSC | Oui, natif |
| **Lexical** | `editable: false` | Pas de renderer specialise, SSR en discussion | Non (issue #4960 ouverte) |
| **Slate** | `readOnly={true}`, chunking + `content-visibility: auto` | **10x speedup** avec chunking, gere 100k+ blocs | Non |

**Verdict** : PlateJS avec `PlateStatic` est le mieux optimise pour du rendu en masse. Slate a du chunking impressionnant. TipTap/BlockNote sont corrects mais necessitent plus de travail d'optimisation. Lexical est le moins avance ici.

**Point important** : pour afficher beaucoup de documents non-editables sur un canvas, tu pourrais aussi envisager de serialiser en HTML statique et rendre avec du simple React/DOM, sans charger d'instance d'editeur du tout. C'est de loin le plus performant. TipTap et PlateJS ont tous deux des serialiseurs HTML.

### 3.5 UI integree (tableaux, images, drag & drop, slash commands)

| Feature | TipTap | BlockNote | PlateJS | Lexical |
|---|---|---|---|---|
| **Tableaux** | Extension Pro (payante) ou communaute | Basique | Complet, redimensionnable | `@lexical/table`, basique |
| **Images** | Extension, resize | Natif | Lazy loading, resize, alignement | DecoratorNode, a construire |
| **Drag & Drop** | Extension, drag handle | Natif, anime | Plugin DND complet | A construire |
| **Slash commands** | UI Components (accessible) | Natif, polished | SlashKit natif | A construire |
| **Toolbar flottante** | A composer | Natif | Natif, contextuel | A construire |
| **Videos/Embeds** | YouTube, Twitch extensions | Basique | YouTube + upload | DecoratorNode |
| **Commentaires** | Extension Pro | Non | Oui, avec replies | Non |
| **AI integre** | Extension Pro (payante) | Non | Oui (SDK AI) | Non |

**Verdict** : PlateJS a l'UI la plus complete. BlockNote est le plus "pret a l'emploi" pour du Notion-like. TipTap a beaucoup derriere un paywall. Lexical necessite de quasiment tout construire.

### 3.6 Cout total

| | Gratuit | Payant |
|---|---|---|
| **TipTap** | Framework + extensions open source | Cloud collab : a partir de 39$/dev/mois. Certaines extensions Pro payantes |
| **BlockNote** | Tout est gratuit (MPL-2.0) | Rien |
| **PlateJS** | Core MIT gratuit | Plate Pro : 499 EUR one-time (composants premium + template AI) |
| **Lexical** | Tout gratuit (MIT) | Rien |
| **Convex prosemirror-sync** | Gratuit, open source | -- |
| **Liveblocks** | 500 rooms/mois gratuites | Pay-as-you-go ensuite |

---

## 4. Les deux stacks recommandees

Apres analyse croisee de tous les criteres, deux options se demarquent nettement :

### Option A : BlockNote + Convex prosemirror-sync (Recommandee)

**Pourquoi :**
- Integration Convex **native** via `@convex-dev/prosemirror-sync` avec hook `useBlockNoteSync` deja fourni
- UI Notion-like polie, prete a l'emploi, zero configuration
- Mentions, slash commands, drag & drop, tout inclus
- 100% gratuit et open source (MPL-2.0)
- Base TipTap/ProseMirror = ecosysteme enorme si tu as besoin d'extensions supplementaires
- Blocs custom faciles a creer

**Limites :**
- Pas de curseurs collaboratifs natifs avec prosemirror-sync (il faudrait ajouter Liveblocks ou un systeme de presence custom via Convex)
- Conversion Markdown : herite de TipTap, correcte mais pas parfaite
- Moins de controle fin que TipTap pur (c'est un wrapper opinionate)
- Rendu read-only : pas de composant `PlateStatic` dedie, mais serialisation HTML possible

**Stack technique :**
```
Frontend : BlockNote (React)
Sync collab : @convex-dev/prosemirror-sync
Backend : Convex (mutations, queries, auth)
Read-only : Serialisation HTML ou instance BlockNote non-editable
Presence (optionnel) : Convex subscriptions custom ou Liveblocks
```

### Option B : PlateJS + Hocuspocus ou Liveblocks

**Pourquoi :**
- UI la plus complete du marche (tableaux avances, commentaires, AI, drag & drop)
- `PlateStatic` pour le rendu read-only en masse = le meilleur de la categorie
- Conversion Markdown bidirectionnelle excellente via `@platejs/markdown`
- Plugin Yjs integre (`@udecode/plate-yjs`)
- Mentions natives avec MentionKit
- Ecosysteme tres actif (v29, releases multiples par mois)

**Limites :**
- **Pas d'integration Convex native** : il faudrait un serveur Hocuspocus separe ou Liveblocks pour la collab, ce qui ajoute de la complexite d'infrastructure
- Plate Pro a 499 EUR pour les composants premium (one-time, pas dramatique)
- Base Slate = moins d'ecosysteme que ProseMirror
- Gerer deux systemes (Convex pour la data + Hocuspocus/Liveblocks pour la collab) ajoute de la complexite operationnelle

**Stack technique :**
```
Frontend : PlateJS (React)
Sync collab : Liveblocks (@liveblocks/react) OU Hocuspocus self-hosted
Backend : Convex (mutations, queries, auth)
Read-only : PlateStatic (optimal)
Stockage docs : Convex DB (JSON Slate)
```

---

## 5. Lexical : pourquoi je ne le recommande pas ici

Lexical est un framework solide, maintenu par Meta, utilise en interne sur Facebook/WhatsApp/Instagram. Mais pour ton cas :

- **Pas d'integration Convex** : rien d'existant, tout a construire from scratch
- **Pas d'UI** : tu devrais construire tableaux, toolbars, slash commands, drag & drop... des mois de travail
- **Mentions** : lib tierce obligatoire
- **Read-only** : pas de rendu optimise, SSR pas encore supporte
- **Markdown** : support basique, edge cases mal geres

Lexical serait pertinent si tu construisais un editeur tres specialise (type code editor, editeur de formules) ou si tu etais dans l'ecosysteme Meta. Pour un editeur de documents collaboratif generaliste, c'est trop bas niveau.

---

## 6. Matrice de decision finale

| Critere | Poids | BlockNote + Convex sync | PlateJS + Liveblocks | TipTap pur + Convex sync | Lexical |
|---|---|---|---|---|---|
| **Integration Convex** | Critique | 10/10 (natif) | 5/10 (2 systemes) | 10/10 (natif) | 2/10 |
| **Collaboration live** | Critique | 8/10 (OT, pas de curseurs) | 9/10 (Yjs + curseurs) | 8/10 (OT, pas de curseurs) | 6/10 |
| **Mentions** | Important | 8/10 | 9/10 | 9/10 | 5/10 |
| **Blocs custom** | Important | 8/10 | 8/10 | 9/10 | 7/10 |
| **Markdown** | Important | 7/10 | 9/10 | 7/10 | 5/10 |
| **Read-only perfs** | Important | 6/10 | 10/10 (PlateStatic) | 6/10 | 4/10 |
| **UI / DX** | Important | 9/10 | 9/10 | 6/10 (a composer) | 2/10 |
| **Cout** | Modere | 10/10 (gratuit) | 7/10 (Liveblocks payant) | 8/10 (certaines ext. payantes) | 10/10 |
| **Score global** | | **8.2** | **8.3** | **7.8** | **4.5** |

---

## 7. Ma recommandation

**Pour ton contexte (Convex backend, besoin de shipping rapide, UI riche) :**

**Commence avec BlockNote + `@convex-dev/prosemirror-sync`.**

Raisons :
1. C'est l'integration la plus directe avec Convex, zero infra supplementaire
2. L'UI est prete, tu peux shipper vite
3. C'est gratuit
4. Tu restes dans l'ecosysteme ProseMirror, donc si tu as besoin de plus de customisation plus tard, tu peux descendre au niveau TipTap

**Pour le rendu read-only en masse sur le canvas :** serialise les documents en HTML statique plutot que de charger des instances d'editeur. BlockNote et TipTap ont des serialiseurs pour ca. C'est de loin la solution la plus performante.

**Pour les curseurs collaboratifs** (si c'est un must-have day 1) : ajoute Liveblocks par-dessus. Ca se combine bien avec BlockNote et Convex. Sinon, tu peux implementer un systeme de presence basique via les subscriptions Convex.

**Si plus tard le rendu read-only ou la conversion Markdown deviennent des pain points majeurs :** envisage une migration vers PlateJS. Mais c'est un plan B, pas un plan A, car la perte de l'integration Convex native est un cout significatif.

---

## Sources principales

- [Convex prosemirror-sync](https://github.com/get-convex/prosemirror-sync)
- [Guide Convex : collaborative editor](https://stack.convex.dev/add-a-collaborative-document-editor-to-your-app)
- [BlockNote](https://www.blocknotejs.org/)
- [PlateJS](https://platejs.org/)
- [TipTap](https://tiptap.dev/)
- [Lexical](https://lexical.dev/)
- [Liveblocks : quel editeur choisir en 2025](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025)
- [Liveblocks pricing](https://liveblocks.io/pricing)
- [PartyKit / y-partykit](https://docs.partykit.io/reference/y-partykit-api/)
- [Automerge + Convex](https://stack.convex.dev/automerge-and-convex)
- [convex-yjs community demo](https://github.com/pyrocat101/convex-yjs)

*Analyse realisee en mars 2026*
