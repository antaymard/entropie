# Navigation vers les nodes mentionnés par Nolë

## Problème

Quand Nolë crée un node, ou lit, ou édite, l'utilisateur ne voit pas facilement de quel node il s'agit.

## Dans les tools call du ChatInterface

Il faudrait que dans les petit container du chat, où on met tool execute: {toolName}, quand le container est collapsed, on ajoute des petits nodes cards cliquables, qui navigate vers le node. Il suffit de parser nodeId ou nodeIds dans les args du tool.

## Dans les réponses texte de Nolë

Si Nolë mentionne un nodeId (facile à reconnaitre, cf llmId), on remplace l'id par une petite card cliquable également.

## Card cliquable

C'est l'icône (voir iconMap) et le titre, coupé après X caractères.
