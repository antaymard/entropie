"use client";

import { TogglePlugin } from "@platejs/toggle/react";

import { IndentKit } from "@/components/plate/indent-kit";
import { ToggleElement } from "@/components/plate/toggle-node";

export const ToggleKit = [
  ...IndentKit,
  TogglePlugin.withComponent(ToggleElement),
];
