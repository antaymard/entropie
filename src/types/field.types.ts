export interface FieldDefinition {
  label: string;
  icon: React.ComponentType;
  description?: string;
  type: FieldType;

  // Par exemple pour un select : { options: [ "option1", "option2" ] }
  //   Indépendant du visual choisi
  optionsList?: Array<{
    key: string;
    label: string;
    type: string;
    props?: any;
  }>;
  visuals?: {
    node: Record<string, unknown>;
    // default : {
    //     component : TextInput, // Le component React à utiliser pour ce field
    //     props: { placeholder: string }, // Ce qui sera passé au component
    //     settingsList : []; // Ce qui peut être changé sur le field dans l'éditeur
    // }
    window: Record<string, unknown>;
  };
}

export type FieldType =
  | "short_text"
  | "url"
  | "select"
  | "image"
  | "image_url"
  | "number"
  | "date"
  | "rich_text"
  | "boolean";
