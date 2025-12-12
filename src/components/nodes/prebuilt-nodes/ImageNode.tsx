import { type Node, useReactFlow } from "@xyflow/react";
import { memo, useMemo, useState, useCallback, useEffect, useRef } from "react";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import { UploadFile } from "../../fields/UploadFile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../shadcn/tabs";
import { Check, X } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { debounce } from "lodash";
import { useCanvasStore } from "@/stores/canvasStore";

function ImageNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();
  const [urlInput, setUrlInput] = useState("");
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const hasInitialized = useRef(false);
  const currentCanvasTool = useCanvasStore((state) => state.currentCanvasTool);

  const handleUploadComplete = (fileData: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt: number;
    key: string;
  }) => {
    updateNodeData(xyNode.id, { url: fileData.url });
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      updateNodeData(xyNode.id, { url: urlInput.trim() });
      setUrlInput("");
    }
  };

  // Debounced update function - créé une seule fois et réutilisé
  const debouncedUpdate = useMemo(
    () =>
      debounce((scale: number, positionX: number, positionY: number) => {
        updateNodeData(xyNode.id, {
          inImageNavigation: { scale, positionX, positionY },
        });
      }, 300),
    [xyNode.id, updateNodeData]
  );

  // Nettoyage du debounce au démontage
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  // Handler pour les transformations
  const handleTransform = useCallback(
    (_e: unknown, { scale, positionX, positionY }: any) => {
      debouncedUpdate(scale, positionX, positionY);
    },
    [debouncedUpdate]
  );

  // Restaurer la position après le montage du TransformWrapper
  useEffect(() => {
    if (!transformRef.current || hasInitialized.current || !xyNode.data.url) {
      return;
    }

    const savedTransform = xyNode.data.inImageNavigation as
      | { scale: number; positionX: number; positionY: number }
      | undefined;

    if (savedTransform) {
      setTimeout(() => {
        transformRef.current?.setTransform(
          savedTransform.positionX,
          savedTransform.positionY,
          savedTransform.scale,
          0
        );
        hasInitialized.current = true;
      }, 0);
    }
  }, [xyNode.data.url, xyNode.data.inImageNavigation]);

  function renderImageOrInput() {
    if (xyNode.data.url) {
      return (
        <TransformWrapper
          disabled={currentCanvasTool !== "default"}
          ref={transformRef}
          panning={{ velocityDisabled: true }}
          doubleClick={{ disabled: true }}
          onTransformed={handleTransform}
        >
          <TransformComponent wrapperClass="flex-1" contentClass="flex-1">
            <img
              src={xyNode.data.url as string}
              alt=""
              className="w-full h-full object-cover"
            />
          </TransformComponent>
        </TransformWrapper>
      );
    }

    return (
      <div className="p-4">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">
              Image
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1">
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <UploadFile
              onUploadComplete={handleUploadComplete}
              accept="image/*"
            />
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="p-2 text-white bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Valider"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUrlInput("")}
                  disabled={!urlInput}
                  className="p-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Effacer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode} />
      <NodeFrame
        xyNode={xyNode}
        headerless={Boolean(xyNode.data.headerless)}
        nodeContentClassName="-p-3 nodrag"
      >
        {renderImageOrInput()}
      </NodeFrame>
    </>
  );
}

export default memo(ImageNode);
