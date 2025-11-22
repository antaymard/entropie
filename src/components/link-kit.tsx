'use client';

import { LinkPlugin } from '@platejs/link/react';

import { LinkElement } from '@/components/shadcn/link-node';
import { LinkFloatingToolbar } from '@/components/shadcn/link-toolbar';

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];
