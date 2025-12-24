import { Tabs, TabsContent, TabsList, TabsTrigger } from "../shadcn/tabs";
import { NodeTemplateRendererEditor } from "../renderers/CustomTemplateRenderer";
import { useNodeEditorContext } from "@/hooks/useNodeEditorContext";
import { useFormikContext } from "formik";
import { get } from "lodash";

export default function NodeEditorPreviewPanel() {
  const { currentVisualLayoutPath, setCurrentVisualLayoutPath } =
    useNodeEditorContext();

  const { values } = useFormikContext();

  const activeTab = currentVisualLayoutPath.includes("visuals.window")
    ? "window"
    : "node";

  const handleTabChange = (value: string) => {
    if (value === "node") {
      setCurrentVisualLayoutPath("visuals.node.default.layout");
    } else {
      setCurrentVisualLayoutPath("visuals.window.default.layout");
    }
  };

  // Get default dimensions for node preview
  const layout = get(values, currentVisualLayoutPath);
  const rootData = layout?.data as Record<string, unknown> | undefined;

  // Parse default dimensions (stored as "150px" -> 150)
  const defaultWidth = rootData?.defaultWidth
    ? parseInt(String(rootData.defaultWidth).replace('px', ''))
    : undefined;
  const defaultHeight = rootData?.defaultHeight
    ? parseInt(String(rootData.defaultHeight).replace('px', ''))
    : undefined;

  return (
    <div className="bg-gray-50 p-10 overflow-auto h-full flex flex-col gap-4">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col items-center flex-1 min-h-0"
      >
        <TabsList>
          <TabsTrigger value="node">Vue bloc</TabsTrigger>
          <TabsTrigger value="window">Vue fenêtre</TabsTrigger>
        </TabsList>
        <TabsContent value="node" className="flex flex-col items-center gap-4">
          <p className="text-sm italic">Ce qui apparaît sur la toile</p>
          <div
            className="bg-white rounded-md shadow border border-gray-300"
            style={{
              width: defaultWidth ? `${defaultWidth}px` : 'auto',
              height: defaultHeight ? `${defaultHeight}px` : 'auto',
            }}
          >
            <NodeTemplateRendererEditor />
          </div>
          <div />
        </TabsContent>
        <TabsContent
          value="window"
          className="flex flex-col items-center gap-4"
        >
          <p className="text-sm italic">
            Quand vous double-cliquez sur le bloc
          </p>
          <div className="bg-white rounded-md shadow border border-gray-300 p-4 min-w-96">
            <NodeTemplateRendererEditor />
          </div>
          <div />
        </TabsContent>
      </Tabs>
    </div>
  );
}
