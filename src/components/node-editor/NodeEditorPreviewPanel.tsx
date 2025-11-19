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

  return (
    <div className="bg-gray-50  p-10">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col items-center justify-between flex-1 h-full"
      >
        <TabsList>
          <TabsTrigger value="node">Vue bloc</TabsTrigger>
          <TabsTrigger value="window">Vue fenêtre</TabsTrigger>
        </TabsList>
        <TabsContent
          value="node"
          className="flex flex-col items-center justify-between"
        >
          <p className="text-sm italic">Ce qui apparaît sur la toile</p>
          <NodeTemplateRendererEditor />

          <pre>
            {JSON.stringify(get(values, currentVisualLayoutPath), null, 2)}
          </pre>
          <div />
        </TabsContent>
        <TabsContent
          value="window"
          className="flex flex-col items-center justify-center"
        >
          <p className="text-sm italic">
            Quand vous double-cliquez sur le bloc
          </p>
          <NodeTemplateRendererEditor />
          <div />
        </TabsContent>
      </Tabs>
    </div>
  );
}
