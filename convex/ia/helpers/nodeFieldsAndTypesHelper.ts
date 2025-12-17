// Types for node configuration
export interface NodeProperty {
  name: string;
  type: "string" | "number" | "array" | "object" | "boolean";
  required: boolean;
  description?: string;
  default?: unknown;
  enum?: string[];
  items?: {
    type: string;
    properties?: NodeProperty[];
  };
}

export interface NodeExpectedDataProps {
  type: string;
  required: boolean;
  properties?: NodeProperty[];
}

export interface NodeTypeConfig {
  label: string;
  type: string;
  description: string;
  dimensions?: {
    minWidth: number;
    minHeight: number;
    canBeResized: boolean;
  };
  expectedDataProps?: NodeExpectedDataProps;
  dataExample?: {
    data: Record<string, unknown>;
  };
}

export const nodeFields = [
  {
    label: "Texte_court",
    type: "short_text",
    description:
      "Texte court. Pratique pour les titres. Peut-être formatté en h1, h2, h3 ou paragraphe, de façon globale pour tout le champ.",
    expectedDataProps: {
      type: "string",
      required: true,
    },
    nodeDataExample: {
      data: "Ceci est un texte court.",
    },
  },
];

export const nodeFieldsStructureExplained = (element: "node" | "field") => ({
  label: "Nom du champ, affiché dans l'interface",
  type: `Type de ${element}`,
  description: "Description du champ, pour aider à comprendre son utilité",
  dimensions: {
    minWidth:
      "La largeur minimale du nœud ou champ. Sera prise par défaut si non spécifiée.",
    minHeight:
      "La hauteur minimale du nœud ou champ. Sera prise par défaut si non spécifiée.",
    canBeResized:
      "Indique si le nœud ou champ peut être redimensionné par l'utilisateur sur le canvas. Si false, les dimensions doivent être minWidth et minHeight.",
  },
  expectedDataProps:
    "Structure de données spécifique au type de champ. Si vide, la valeur est mise directement dans data.",
  dataExample: "Exemple de structure de données attendue pour ce champ.",
});

export const nodeTypes: NodeTypeConfig[] = [
  {
    label: "Texte flottant",
    type: "floatingText",
    dimensions: {
      minWidth: 100,
      minHeight: 28,
      canBeResized: true,
    },
    description:
      "Bloc de texte simple, affiché directement sur le canvas. Peut être déplacé librement. Permet de structurer des zones dans le canvas. Utile pour les annotations ou les titres. Peut être formaté en h1, h2, h3 ou paragraphe, globalement pour tout le bloc.",
    expectedDataProps: {
      type: "object",
      required: true,
      properties: [
        {
          name: "text",
          type: "string",
          required: true,
          description: "Le contenu textuel du bloc.",
        },
        {
          name: "level",
          type: "string",
          enum: ["h1", "h2", "h3", "p"],
          required: true,
          default: "p",
          description:
            "Le niveau de titre ou paragraphe pour le formatage du texte.",
        },
      ],
    },
    dataExample: {
      data: {
        text: "Ceci est un texte flottant sur le canvas.",
        level: "h2",
      },
    },
  },
  {
    label: "Image",
    type: "image",
    description: "Bloc image simple, affiché directement sur le canvas.",
    dimensions: {
      minWidth: 100,
      minHeight: 100,
      canBeResized: true,
    },
    expectedDataProps: {
      type: "object",
      required: true,
      properties: [
        {
          name: "url",
          type: "string",
          required: true,
          description: "L'URL de l'image à afficher.",
        },
      ],
    },
  },
  {
    label: "Lien web",
    type: "link",
    dimensions: {
      minWidth: 220,
      minHeight: 40,
      canBeResized: false,
    },
    description: "Lien web simple, affiché directement sur le canvas.",
    expectedDataProps: {
      type: "object",
      required: true,
      properties: [
        {
          name: "url",
          type: "string",
          required: true,
          description: "L'URL du lien web à afficher.",
        },
      ],
    },
  },
  {
    label: "PDF attaché",
    description: "PDF attaché. Affichable dans le viewer du node window.",
    type: "file",
    dimensions: {
      minWidth: 220,
      minHeight: 40,
      canBeResized: false,
    },
    expectedDataProps: {
      type: "object",
      required: true,
      properties: [
        {
          name: "files",
          type: "array",
          required: true,
          description: "Les fichiers attachés.",
          items: {
            type: "object",
            properties: [
              { name: "url", type: "string", required: true },
              { name: "filename", type: "string", required: true },
              { name: "mimeType", type: "string", required: true },
            ],
          },
        },
      ],
    },
  },
  {
    label: "Document Rich Text",
    type: "document",
    description: "Document riche en texte, basé sur platejs.",
    dimensions: {
      minWidth: 250,
      minHeight: 150,
      canBeResized: true,
    },
    expectedDataProps: {
      type: "object",
      required: true,
      properties: [
        {
          name: "doc",
          description: "Le contenu du document en **markdown.**",
          type: "string",
          required: true,
        },
      ],
    },
  },
];
