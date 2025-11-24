"use client";

import { createPlatePlugin } from "platejs/react";

import { FloatingToolbar } from "@/components/plate/floating-toolbar";
import { FloatingToolbarButtons } from "@/components/plate/floating-toolbar-buttons";

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: "floating-toolbar",
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
];
