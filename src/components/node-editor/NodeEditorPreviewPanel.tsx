import { Tabs, TabsContent, TabsList, TabsTrigger } from "../shadcn/tabs";
import NodeTemplateRenderer from "./NodeTemplateRenderer";

export default function NodeEditorPreviewPanel() {
  return (
    <div className="bg-gray-50  p-10">
      <Tabs
        defaultValue="node"
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
          <NodeTemplateRenderer />
          <div />
        </TabsContent>
        <TabsContent
          value="window"
          className="flex flex-col items-center justify-center"
        >
          <p className="text-sm italic">
            Quand vous double-cliquez sur le bloc
          </p>
          <div />
        </TabsContent>
      </Tabs>
    </div>
  );
}
