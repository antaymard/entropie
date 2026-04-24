# Spec: Amélioration SDK nolenor.getData()

## 1. Problème rencontré

### Symptôme

Lors de la création d'un App Node pour visualiser les données d'un tableau, le graphique s'affiche (axes, titres) mais les lignes/courbes n'apparaissent pas.

### Cause racine

Incohérence entre la structure de données retournée par `nolenor.getData()` et les informations fournies par `read_nodes`.

**Structure retournée par `nolenor.getData()` :**

```javascript
{
  "pzf8Kou1GNo1cDt0": {
    "type": "table",
    "rows": [
      {
        "id": "bcP4iuJ9bmC7Kgg0",
        "cells": {           // <- Données imbriquées dans "cells"
          "annee": "1990",
          "dette": "~363",
          "pib": "~36%"
        }
      }
    ]
  }
}
```

**Informations affichées par `read_nodes` :**

```
Column IDs (use these IDs for table_insert_rows and table_update_rows):
- annee: Année
- dette: Dette (Mds €)
- pib: % du PIB
```

L'IA (et le développeur) suppose que les données sont accessibles via `row.annee`, alors qu'il faut utiliser `row.cells.annee`.

### Impact

- Erreur de développement fréquente
- Données lues comme `undefined` → `NaN` dans les graphiques
- Temps de debug important (console.log, essais successifs)

---

## 2. Solution proposée

### Option choisie : Aplatissement des données (Flatten)

Modifier `nolenor.getData()` pour retourner une structure plate, correspondant aux Column IDs affichés par `read_nodes`.

**Nouvelle structure :**

```javascript
{
  "pzf8Kou1GNo1cDt0": {
    "type": "table",
    "rows": [
      {
        "id": "bcP4iuJ9bmC7Kgg0",
        "annee": "1990",      // <- Directement accessible
        "dette": "~363",
        "pib": "~36%"
      }
    ]
  }
}
```

### Avantages

1. ✅ Correspond exactement aux Column IDs de `read_nodes`
2. ✅ Intuitif : `row.annee` fonctionne directement
3. ✅ Pas de modification du SDK côté client
4. ✅ Rétrocompatibilité : les apps existantes utilisant `row.cells?.annee` continueront de fonctionner avec un petit ajustement

---

## 3. Changements techniques

### Dans le SDK (nolenor.getData)

```javascript
// Avant
rows.map((row) => ({
  id: row.id,
  cells: row.cells,
}));

// Après
rows.map((row) => ({
  id: row.id,
  ...row.cells, // Aplatit toutes les cellules au niveau racine
}));
```

### Côté IA / Développeur

**Avant (incorrect) :**

```javascript
const labels = rows.map((r) => r.annee); // undefined
const dette = rows.map((r) => r.dette); // undefined
```

**Après (correct) :**

```javascript
const labels = rows.map((r) => r.annee); // "1990", "1995", etc.
const dette = rows.map((r) => r.dette); // "~363", etc.
```

---

## 4. Impact et bénéfices

| Aspect                    | Avant             | Après       |
| ------------------------- | ----------------- | ----------- |
| Lisibilité                | `row.cells.annee` | `row.annee` |
| Correspondance read_nodes | ❌ Non            | ✅ Oui      |
| Courbe d'apprentissage    | Raide             | Intuitive   |
| Debug                     | Nécessaire        | Minimisé    |

---

## 5. Exemple avant/après

### Code de l'App Node (avant)

```javascript
React.useEffect(() => {
  nolenor.getData().then((d) => {
    const tableData = d["pzf8Kou1GNo1cDt0"];
    const rows = tableData.rows;

    // ❌ Ne fonctionne pas
    const labels = rows.map((r) => r.annee);

    // ✅ Fonctionne mais pas intuitif
    const labels = rows.map((r) => r.cells.annee);
  });
}, []);
```

### Code de l'App Node (après)

```javascript
React.useEffect(() => {
  nolenor.getData().then((d) => {
    const tableData = d["pzf8Kou1GNo1cDt0"];
    const rows = tableData.rows;

    // ✅ Fonctionne directement
    const labels = rows.map((r) => r.annee);
    const dette = rows.map((r) => r.dette);
  });
}, []);
```

---

## 6. Migration

- Les Apps existantes utilisant `row.cells?.prop` continueront de fonctionner si on garde une rétrocompatibilité
- Recommandation : migrer vers la structure plate progressivement
- Mise à jour de la documentation SDK nécessaire
