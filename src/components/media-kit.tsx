'use client';

import { CaptionPlugin } from '@platejs/caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@platejs/media/react';
import { KEYS } from 'platejs';

import { AudioElement } from '@/components/shadcn/media-audio-node';
import { MediaEmbedElement } from '@/components/shadcn/media-embed-node';
import { FileElement } from '@/components/shadcn/media-file-node';
import { ImageElement } from '@/components/shadcn/media-image-node';
import { PlaceholderElement } from '@/components/shadcn/media-placeholder-node';
import { MediaPreviewDialog } from '@/components/shadcn/media-preview-dialog';
import { MediaUploadToast } from '@/components/shadcn/media-upload-toast';
import { VideoElement } from '@/components/shadcn/media-video-node';

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
];
