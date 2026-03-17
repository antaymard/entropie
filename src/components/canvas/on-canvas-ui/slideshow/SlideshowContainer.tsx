import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";
import SlideshowList from "./SlideshowList";
import SlideshowEditor from "./SlideshowEditor";

export default function SlideshowContainer({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  const [layout, setLayout] = useState<string>("list");

  if (layout === "list") {
    return <SlideshowList canvasId={canvasId} setLayout={setLayout} />;
  } else
    return (
      <SlideshowEditor
        canvasId={canvasId}
        slideshowId={layout}
        setLayout={setLayout}
      />
    );
}
