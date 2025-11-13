import { useStore } from "@xyflow/react";
import { memo } from "react";
import type { Node } from "@xyflow/react";

interface DocumentWindowProps {
  windowId: string;
}

function DocumentWindow({ windowId }: DocumentWindowProps) {
  // Récupère uniquement la data du node, re-render uniquement quand elle change
  const nodeData = useStore(
    (state) => state.nodes.find((n: Node) => n.id === windowId)?.data
  );

  return (
    <div>
      {/* Affiche le contenu basé sur nodeData */}
      {JSON.stringify(nodeData)}
    </div>
  );
}

export default memo(DocumentWindow);
