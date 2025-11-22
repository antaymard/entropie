import { BaseDatePlugin } from '@platejs/date';

import { DateElementStatic } from '@/components/shadcn/date-node-static';

export const BaseDateKit = [BaseDatePlugin.withComponent(DateElementStatic)];
