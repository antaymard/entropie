import { type Node, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import { UploadFile } from "../../fields/UploadFile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../shadcn/tabs";
import { Check, X } from "lucide-react";

function ImageNode(xyNode: Node) {
  const { updateNodeData } = useReactFlow();
  const [urlInput, setUrlInput] = useState("");

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

  const handleClearUrl = () => {
    setUrlInput("");
  };

  function renderImageOrInput() {
    if (xyNode.data.url) {
      return (
        <img
          src={xyNode.data.url as string}
          className="w-full h-full object-cover"
        />
      );
    } else {
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUrlInput(e.target.value)
                  }
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      handleUrlSubmit();
                    }
                  }}
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
                    onClick={handleClearUrl}
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
  }

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode} />
      <NodeFrame
        xyNode={xyNode}
        frameless={Boolean(xyNode.data.frameless)}
        nodeContentClassName="-p-3"
      >
        {renderImageOrInput()}
      </NodeFrame>
    </>
  );
}

export default memo(ImageNode);
