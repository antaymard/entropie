import { NodeResizer, type NodeProps } from "@xyflow/react";
import { memo } from "react";

interface NodeData {
  name?: string;
  color?: string;
  label?: string;
  [key: string]: unknown;
}

function NodeFrame(node: NodeProps) {
  // ✅ Récupère uniquement ce node, re-render seulement si LUI change

  if (!node) return null;
  const data = node.data as NodeData;

  return (
    <>
      <NodeResizer minWidth={100} minHeight={100} isVisible={node?.selected} />
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: data.color || "#ffffff",
          border: node.selected ? "2px solid #1a73e8" : "1px solid #e0e0e0",
          borderRadius: "4px",
          padding: "8px",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          {data.name || "Sans nom"}
        </div>
        {/* Ici vous pouvez rendre le contenu spécifique du node */}
        {data.label && <div>{data.label}</div>}
      </div>
    </>
  );
}

export default memo(NodeFrame);
