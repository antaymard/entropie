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

export interface WebSearchInput {
  objective: string;
  search_queries?: string[];
}
export interface WebSearchResult {
  excerpts: string[];
  publish_date?: string;
  title: string;
  url: string;
}
export type WebSearchToolPart = ToolCallPart<WebSearchInput, WebSearchResult[]>;

export interface OpenWebpageInput {
  urls: string[];
  objective: string;
  search_queries?: string[];
}
export interface OpenWebpageResult {
  url: string;
  title: string;
  full_content: string;
  excerpts: string[];
  publish_date?: string;
}
export type OpenWebpageToolPart = ToolCallPart<
  OpenWebpageInput,
  OpenWebpageResult[]
>;

export interface ToolCallPart<TInput = unknown, TOutput = unknown> {
  type: string; // "tool-web_search", "tool-open_web_page", etc.
  toolCallId: string;
  state: "input-streaming" | "output-available";
  input?: TInput;
  output?: TOutput;
  callProviderMetadata?: Record<string, unknown>;
}

export type MessagePart =
  | StepStartPart
  | TextPart
  | WebSearchToolPart
  | OpenWebpageToolPart
  | ToolCallPart;

// Interface générique pour les props des composants de tool cards
export interface ToolCardProps<TInput = unknown, TOutput = unknown> {
  state: "input-streaming" | "output-available";
  input?: TInput;
  output?: TOutput;
}
