import NodeTemplateRenderer from "./NodeTemplateRenderer";

export default function NodeEditorPreviewPanel() {
  return (
    <div className="flex items-center justify-center bg-gray-50  p-10">
      <NodeTemplateRenderer />
    </div>
  );
}
