# Améliorer l'injection de contexte message

## Envoi côté client

Le `ChatInterface` envoie un objet JSON assez complet sur ce que le user a à l'écran.

## Ce qui est introduit dans le LLM

Il y a transformation du JSON en du pseudo XML.

```
<message_context>
  <attachedNodes>
    <item>
      <id>994k403g</id>
      <position>
        <x>649</x>
        <y>960</y>
      </position>
      <size>
        <height>226</height>
        <width>321</width>
      </size>
      <title>Benefits du Thé Vert</title>
      <type>document</type>
    </item>
  </attachedNodes>
  <attachedPosition />
  <generatedAt>Friday, April 24, 2026 at 01:23:35 PM</generatedAt>
  <openNodes />
  <viewport>
    <bounds>
      <x1>0</x1>
      <x2>2560</x2>
      <y1>267</y1>
      <y2>1649</y2>
    </bounds>
    <size>
      <height>1037</height>
      <width>1920</width>
    </size>
    <visibleNodeIds>
      <item>462h131v</item>
      <item>366J320g</item>
      <item>791v384n</item>
      <item>070x997U</item>
      <item>518C739z</item>
      <item>139c704z</item>
      <item>454B154E</item>
      <item>718T352a</item>
      <item>020g611f</item>
      <item>764w568B</item>
      <item>238h694p</item>
      <item>918E225y</item>
      <item>007q269R</item>
      <item>151z776n</item>
      <item>308W967T</item>
      <item>884i360X</item>
      <item>920P832G</item>
      <item>658B365R</item>
      <item>931E861f</item>
      <item>218M890d</item>
      <item>792F946U</item>
      <item>757n384o</item>
      <item>660k976J</item>
      <item>498L781U</item>
      <item>428F659l</item>
      <item>131k755k</item>
      <item>650p960T</item>
      <item>019V156M</item>
      <item>387s354Z</item>
      <item>564X823D</item>
      <item>365u213P</item>
      <item>770A516c</item>
      <item>994k403g</item>
      <item>644t846s</item>
      <item>654g891g</item>
      <item>460J487O</item>
      <item>598K489B</item>
      <item>dxl5CGY4YSV8YiJ0</item>
    </visibleNodeIds>
    <zoom>0.75</zoom>
  </viewport>
</message_context>
```

## Coordonnées

Les coordonnées des nodes passent du format x,y de l'origine à [point haut-gauche -> point bas-droite], ex [100, 200 -> 300, 400]. Il faut donc utiliser width et height pour le calculer.
Les valeurs sont arrondies à l'unité.

## Nouveau format d'injection

Sans nécessairement changer ce qui est envoyé du client, on va améliorer l'injection dans le prompt.

### Suppression de certaines informations

- `<zoom>` est retiré
- `<size>` et son contenu sont retirés
- `<generatedAt>` est supprimé

Quand une balise est vide (par exemple `<openNodes/>`, `<attachedPosition/>`), elle est masquée plutôt que mise vide.

### Changement de format du balisage

On va faire un mix de xml pour le balisage grossier, et du texte libre.

- `<viewport>` va contenir inline les bounds : `<viewport bounds=[x1, y1 -> x2, y2]>` par exemple
- `<openNodes>` devient `<open_nodes>`
- `<attachedPosition>` devient `<target_position_on_canvas/>`
- `<attachedNodes>`devient `<attached_nodes>`
- `<visibleNodeIds>`devient `<visible_nodes>`

### Syntaxe des nodes

Plutôt que du xml verbeux, on va s'inspirer de la logique présente dans `generateCanvasMinimap.ts`.
A chaque fois, retour à la ligne. Une liste simple en plain text donc.

Pour les `<attached_nodes>` :
`nodeId [nodeType] [x1, y1 -> x2, y2] nodeTitle`

Pour les `<visible_nodes>` :
`nodeId [nodeType] nodeTitle`

Pour `<open_nodes>`:
`nodeId [nodeType] (x, y) nodeTitle`

### Optimisation

Pour les visible_nodes, si n > 10, on passe en truncated.
En dessous de la liste, on ajoute ...truncated list. total is XX

## Aide à l'utilisation du contexte

En dessous de la balise <message_context>, on précise que les coordonnées sont données en [point haut-gauche -> point bas-droite], ex [100, 200 -> 300, 400].
