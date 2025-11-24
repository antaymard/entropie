import { BaseTogglePlugin } from "@platejs/toggle";

import { ToggleElementStatic } from "@/components/plate/toggle-node-static";

export const BaseToggleKit = [
  BaseTogglePlugin.withComponent(ToggleElementStatic),
];
