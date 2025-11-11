# InlineEditableText

Composant réutilisable pour éditer du texte en double-cliquant.

## Fonctionnalités

- ✅ Double-clic pour activer l'édition
- ✅ Enter pour sauvegarder
- ✅ Echap pour annuler
- ✅ Clic ailleurs (blur) pour sauvegarder (configurable)
- ✅ Compatible avec Formik
- ✅ Fonctionne aussi sans Formik
- ✅ Support de différents éléments HTML (span, div, h1, h2, etc.)

## Utilisation

### Sans Formik

```tsx
import InlineEditableText from "@/components/common/InlineEditableText";

function MyComponent() {
  const [name, setName] = useState("Mon nom");

  return (
    <InlineEditableText
      value={name}
      onSave={(newValue) => setName(newValue)}
      placeholder="Sans nom"
    />
  );
}
```

### Avec Formik

```tsx
import { Formik, Form } from "formik";
import InlineEditableText from "@/components/common/InlineEditableText";

function MyForm() {
  return (
    <Formik
      initialValues={{ name: "Mon nom" }}
      onSubmit={(values) => console.log(values)}
    >
      <Form>
        <InlineEditableText
          name="name"
          placeholder="Sans nom"
        />
      </Form>
    </Formik>
  );
}
```

### Dans NodeFrame

```tsx
import NodeFrame from "@/components/nodes/NodeFrame";

function MyNode(xyNode: Node) {
  return (
    <NodeFrame
      xyNode={xyNode}
      showName={true} // Active l'affichage du nom éditable
    >
      {/* Contenu du node */}
    </NodeFrame>
  );
}
```

### Avec différents éléments HTML

```tsx
<InlineEditableText
  value={title}
  onSave={setTitle}
  as="h1" // Rendu en tant que <h1>
  textClassName="text-2xl font-bold"
/>

<InlineEditableText
  value={subtitle}
  onSave={setSubtitle}
  as="h2" // Rendu en tant que <h2>
  textClassName="text-xl"
/>

<InlineEditableText
  value={description}
  onSave={setDescription}
  as="div" // Rendu en tant que <div>
/>
```

## Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `value` | `string` | - | Valeur du texte (mode non-Formik) |
| `onSave` | `(value: string) => void` | - | Callback de sauvegarde (mode non-Formik) |
| `name` | `string` | - | Nom du champ Formik (mode Formik) |
| `className` | `string` | - | Classes CSS du wrapper |
| `textClassName` | `string` | - | Classes CSS du texte/input |
| `placeholder` | `string` | `"Cliquez pour éditer..."` | Placeholder quand vide |
| `saveOnBlur` | `boolean` | `true` | Sauvegarde automatique sur blur |
| `as` | `keyof JSX.IntrinsicElements` | `"span"` | Type d'élément HTML |

## Raccourcis clavier

- **Double-clic** : Active le mode édition
- **Enter** : Sauvegarde les modifications
- **Echap** : Annule et restaure la valeur précédente
- **Clic ailleurs (Blur)** : Sauvegarde (si `saveOnBlur={true}`)

## Exemples d'intégration

### FloatingTextNode

Le composant a été refactorisé pour utiliser `InlineEditableText` :

```tsx
<InlineEditableText
  value={(canvasNode?.data?.text as string) || ""}
  onSave={handleTextSave}
  textClassName={textClassName}
  placeholder="Double-cliquez pour éditer..."
  as={canvasNode.data.level as keyof JSX.IntrinsicElements}
/>
```

### NodeFrame avec nom éditable

```tsx
{showName && (
  <BaseNodeHeader>
    <BaseNodeHeaderTitle>
      <InlineEditableText
        value={(canvasNode?.data?.name as string) || "Sans nom"}
        onSave={handleNameSave}
        textClassName="text-sm font-semibold"
        placeholder="Sans nom"
      />
    </BaseNodeHeaderTitle>
  </BaseNodeHeader>
)}
```
