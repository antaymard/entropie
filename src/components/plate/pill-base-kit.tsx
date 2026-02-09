import { PillPlugin } from "./pill-kit";
import { PillLeafStatic } from "./pill-node-static";

export const BasePillPlugin = PillPlugin.withComponent(PillLeafStatic);

export const BasePillKit = [BasePillPlugin];
