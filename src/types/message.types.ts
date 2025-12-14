// Types pour les parts des messages AI

export type PartState =
  | "input-streaming"
  | "output-available"
  | "streaming"
  | "done";

export interface StepStartPart {
  type: "step-start";
}

export interface TextPart {
  type: "text";
  text: string;
  state: "streaming" | "done";
  providerMetadata?: Record<string, unknown>;
}

// Interface générique pour les props des composants de tool cards
export interface ToolCardProps<TInput = unknown, TOutput = unknown> {
  state: "input-streaming" | "output-available";
  input?: TInput;
  output?: TOutput;
}
