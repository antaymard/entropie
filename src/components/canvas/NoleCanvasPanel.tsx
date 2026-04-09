import NoleIcon from "@/assets/svg-components/NoleIcon";
import ChatContainer from "@/components/canvas/nole-panel/ChatContainer";
import { Button } from "../shadcn/button";
import { Kbd } from "../shadcn/kbd";
import { useState } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";

type Layout = "minimized" | "expanded";

export default function NoleCanvasPanel() {
  const [layout, setLayout] = useState<Layout>("minimized");

  useHotkey("N", () =>
    setLayout((s) => (s === "minimized" ? "expanded" : "minimized")),
  );

  return (
    <div className="relative">
      {layout === "expanded" && (
        <div className="absolute bottom-10 canvas-ui-container p-0! w-95 h-[calc(100dvh-6rem)]">
          <ChatContainer onClose={() => setLayout("minimized")} />
        </div>
      )}
      <div className="canvas-ui-container px-0!">
        <Button
          variant="ghost"
          onClick={() => {
            if (layout === "minimized") {
              setLayout("expanded");
            } else {
              setLayout("minimized");
            }
          }}
        >
          <NoleIcon /> Nolë
          <Kbd>N</Kbd>
        </Button>
      </div>
    </div>
  );
}
