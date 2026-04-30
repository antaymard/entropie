import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { Value } from "platejs";
import { Minimize2, Save, X, Minus } from "lucide-react";
import { TbLocation, TbRefresh } from "react-icons/tb";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useWindowsStore, type OpenedWindow } from "@/stores/windowsStore";
import { useNodeData, useNodeDataValuesField } from "@/hooks/useNodeData";
import { useNodeDataTitle } from "@/hooks/useNodeTitle";
import { getNodeIcon } from "@/components/utils/nodeDataDisplayUtils";
import { WindowFrameContext } from "./WindowFrameContext";
import DocumentWindow from "./prebuilt/DocumentWindow";
import ChatContainer from "@/components/canvas/nole-panel/ChatContainer";
import ConfirmableButton from "@/components/ui/ConfirmableButton";
import NoleIcon from "@/assets/svg-components/NoleIcon";
import { parseStoredPlateDocument } from "@/../convex/lib/plateDocumentStorage";

interface FullscreenDocumentWindowProps {
  openedWindow: OpenedWindow;
}

type Heading = { id: string; depth: number; title: string };

const HEADING_TYPE_RE = /^h([1-6])$/;

function extractHeadings(doc: Value | undefined): Heading[] {
  if (!doc) return [];
  const headings: Heading[] = [];
  for (const node of doc) {
    const type = (node as { type?: string }).type ?? "";
    const match = HEADING_TYPE_RE.exec(type);
    if (!match) continue;
    const children = (node as { children?: Array<{ text?: string }> }).children;
    const title = children?.map((c) => c?.text ?? "").join("").trim() ?? "";
    if (!title) continue;
    headings.push({
      id: (node as { id?: string }).id ?? `heading-${headings.length}`,
      depth: parseInt(match[1], 10),
      title,
    });
  }
  return headings;
}

export default function FullscreenDocumentWindow({
  openedWindow,
}: FullscreenDocumentWindowProps) {
  const { xyNodeId, nodeDataId } = openedWindow;

  const exitFullscreen = useWindowsStore((s) => s.exitFullscreen);
  const closeWindow = useWindowsStore((s) => s.closeWindow);
  const toggleMinimizeWindow = useWindowsStore((s) => s.toggleMinimizeWindow);
  const addDirtyNode = useWindowsStore((s) => s.addDirtyNode);
  const removeDirtyNode = useWindowsStore((s) => s.removeDirtyNode);

  const title = useNodeDataTitle(nodeDataId);
  const nodeData = useNodeData(nodeDataId);
  const NodeIcon = getNodeIcon(nodeData?.type);
  const docSource = useNodeDataValuesField<unknown>(nodeDataId, "doc");

  const { fitView } = useReactFlow();

  const [isDirty, setDirty] = useState(false);
  const [saveHandler, setSaveHandler] = useState<(() => void) | null>(null);
  const [refreshHandler, setRefreshHandler] = useState<(() => void) | null>(
    null,
  );
  const [isChatOpen, setIsChatOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDirty) {
      addDirtyNode(xyNodeId);
    } else {
      removeDirtyNode(xyNodeId);
    }
    return () => removeDirtyNode(xyNodeId);
  }, [isDirty, xyNodeId, addDirtyNode, removeDirtyNode]);

  useHotkey(
    "Mod+S",
    (e) => {
      e.preventDefault();
      saveHandler?.();
    },
    { target: containerRef, enabled: !!saveHandler && isDirty },
  );

  useHotkey("Escape", () => {
    if (isDirty) saveHandler?.();
    exitFullscreen();
  });

  const contextValue = useMemo(
    () => ({
      setDirty,
      setSaveHandler: (fn: (() => void) | null) => setSaveHandler(() => fn),
      setRefreshHandler: (fn: (() => void) | null) =>
        setRefreshHandler(() => fn),
    }),
    [],
  );

  const initialHeadings = useMemo(() => {
    const parsed = parseStoredPlateDocument(docSource) as Value | null;
    return extractHeadings(parsed ?? undefined);
  }, [docSource]);
  const [liveHeadings, setLiveHeadings] = useState<Heading[] | null>(null);
  const headings = liveHeadings ?? initialHeadings;

  const handleDocChange = useCallback((doc: Value) => {
    setLiveHeadings(extractHeadings(doc));
  }, []);

  const scrollToHeading = useCallback((index: number) => {
    const root = editorScrollRef.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>(
      "h1, h2, h3, h4, h5, h6",
    );
    const target = els[index];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <WindowFrameContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col bg-white"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex select-none items-center gap-2 border-b bg-white px-4 py-2">
          {!isChatOpen && (
            <button
              data-window-control="true"
              className="shrink-0 rounded p-1 opacity-70 hover:bg-slate-100 hover:opacity-100"
              onClick={() => setIsChatOpen(true)}
              aria-label="Open Nolë"
              title="Open Nolë"
            >
              <NoleIcon />
            </button>
          )}
          {NodeIcon ? (
            <NodeIcon className="size-4 shrink-0 text-slate-600" />
          ) : null}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {title ?? "—"}
          </span>
          {refreshHandler && (
            <button
              data-window-control="true"
              className="shrink-0 rounded p-1 opacity-50 hover:bg-blue-500/15 hover:text-blue-600 hover:opacity-100"
              onClick={refreshHandler}
              title="Refresh"
            >
              <TbRefresh size={14} />
            </button>
          )}
          {saveHandler && (
            <button
              data-window-control="true"
              className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-green-100 hover:text-green-800 disabled:pointer-events-none disabled:opacity-30"
              onClick={saveHandler}
              disabled={!isDirty}
            >
              <Save size={12} />
              Save
            </button>
          )}
          <button
            data-window-control="true"
            className="shrink-0 rounded p-1 opacity-50 hover:bg-blue-500/15 hover:text-blue-600 hover:opacity-100"
            onClick={() =>
              fitView({
                nodes: [{ id: xyNodeId }],
                duration: 500,
                minZoom: 0.5,
                maxZoom: 1,
              })
            }
            aria-label="Go to node"
            title="Go to node"
          >
            <TbLocation size={14} />
          </button>
          <button
            data-window-control="true"
            className="shrink-0 rounded p-1 opacity-60 hover:bg-blue-500/15 hover:text-blue-600 hover:opacity-100"
            onClick={() => {
              if (isDirty) saveHandler?.();
              exitFullscreen();
            }}
            aria-label="Exit fullscreen"
            title="Exit fullscreen"
          >
            <Minimize2 size={14} />
          </button>
          <button
            data-window-control="true"
            className="shrink-0 rounded p-1 opacity-50 hover:bg-black/10 hover:opacity-100"
            onClick={() => {
              exitFullscreen();
              toggleMinimizeWindow(xyNodeId);
            }}
            aria-label="Minimize"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <ConfirmableButton
            title="Close without saving?"
            text="You have unsaved changes. Do you want to close this window?"
            onCancel={() => closeWindow(xyNodeId)}
            onConfirm={() => {
              if (isDirty) saveHandler?.();
              closeWindow(xyNodeId);
            }}
            shouldConfirm={isDirty}
            cancelLabel="Close without saving"
            confirmLabel="Save and close"
            autoFocusConfirm
          >
            <button
              data-window-control="true"
              className="shrink-0 rounded p-1 opacity-50 hover:bg-red-500/15 hover:text-red-600 hover:opacity-100"
              aria-label="Close"
              title="Close"
            >
              <X size={14} />
            </button>
          </ConfirmableButton>
        </div>

        {/* ── 3-column body ─────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1">
          {/* Left: Nolë chat (collapsible) */}
          {isChatOpen && (
            <aside className="flex w-95 shrink-0 flex-col border-r bg-white [&>div]:shadow-none!">
              <ChatContainer onClose={() => setIsChatOpen(false)} />
            </aside>
          )}

          {/* Middle: editor (full width container, content centered) */}
          <main className="flex min-w-0 flex-1 overflow-hidden [&_[data-slate-editor]]:px-[max(2rem,calc((100%-56rem)/2))]!">
            <div ref={editorScrollRef} className="h-full w-full">
              <DocumentWindow
                xyNodeId={xyNodeId}
                nodeDataId={nodeDataId}
                onDocChange={handleDocChange}
              />
            </div>
          </main>

          {/* Right: outline */}
          <aside className="flex w-95 shrink-0 flex-col border-l bg-white">
            <DocumentOutline
              headings={headings}
              onSelect={scrollToHeading}
            />
          </aside>
        </div>
      </div>
    </WindowFrameContext.Provider>
  );
}

function DocumentOutline({
  headings,
  onSelect,
}: {
  headings: Heading[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Outline
      </div>
      <div className="flex-1 overflow-auto p-2">
        {headings.length === 0 ? (
          <div className="px-2 py-4 text-sm text-slate-400">
            Ajoutez des titres (h1, h2, h3) pour générer le sommaire.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {headings.map((heading, index) => (
              <li key={`${heading.id}-${index}`}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={cn(
                    "block w-full truncate rounded px-2 py-1 text-left text-sm text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900",
                    heading.depth === 1 && "font-semibold text-slate-700",
                    heading.depth === 2 && "pl-4",
                    heading.depth === 3 && "pl-6 text-slate-500",
                    heading.depth >= 4 &&
                      "pl-8 text-xs text-slate-500",
                  )}
                  title={heading.title}
                >
                  {heading.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
