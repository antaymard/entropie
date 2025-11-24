import { BaseSuggestionPlugin } from "@platejs/suggestion";

import { SuggestionLeafStatic } from "@/components/plate/suggestion-node-static";

export const BaseSuggestionKit = [
  BaseSuggestionPlugin.withComponent(SuggestionLeafStatic),
];
