import { BaseCommentPlugin } from '@platejs/comment';

import { CommentLeafStatic } from '@/components/shadcn/comment-node-static';

export const BaseCommentKit = [
  BaseCommentPlugin.withComponent(CommentLeafStatic),
];
