'use client';

import { createPlatePlugin } from 'platejs/react';

import { FixedToolbar } from '@/components/shadcn/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/shadcn/fixed-toolbar-buttons';

export const FixedToolbarKit = [
  createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
];
