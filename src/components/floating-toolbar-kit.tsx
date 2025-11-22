'use client';

import { createPlatePlugin } from 'platejs/react';

import { FloatingToolbar } from '@/components/shadcn/floating-toolbar';
import { FloatingToolbarButtons } from '@/components/shadcn/floating-toolbar-buttons';

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
];
