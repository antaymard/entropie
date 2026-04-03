import NoleIcon from "@/assets/svg-components/NoleIcon";
import { Button } from "../shadcn/button";
import { Kbd } from "../shadcn/kbd";
import { useState } from "react";
import { TbX } from "react-icons/tb";
import { useHotkey } from "@tanstack/react-hotkeys";
import ChatContainer from "./nole-panel/ChatContainer";

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
          <ChatContainer />
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
          <NoleIcon />
          <Kbd>N</Kbd>-<Kbd>Alt + Ctrl</Kbd>
        </Button>
      </div>
    </div>
  );
}
