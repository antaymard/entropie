import { BaseLinkPlugin } from "@platejs/link";

import { LinkElementStatic } from "@/components/plate/link-node-static";

export const BaseLinkKit = [BaseLinkPlugin.withComponent(LinkElementStatic)];
