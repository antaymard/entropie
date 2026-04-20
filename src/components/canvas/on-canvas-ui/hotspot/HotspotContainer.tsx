import type { Id } from "@/../convex/_generated/dataModel";
import HotspotList from "./HotspotList";

export default function HotspotContainer({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  return <HotspotList canvasId={canvasId} />;
}
