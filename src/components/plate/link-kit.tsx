"use client";

import { LinkPlugin } from "@platejs/link/react";

import { LinkElement } from "@/components/plate/link-node";
import { LinkFloatingToolbar } from "@/components/plate/link-toolbar";

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];
