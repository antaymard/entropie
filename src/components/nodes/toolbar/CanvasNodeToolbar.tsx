import { NodeToolbar, type Node } from "@xyflow/react";
import { memo } from "react";
import ColorSelector from "./ColorSelector";
import type { CanvasNode } from "@/types";

function CanvasNodeToolbar({ children, xyNode, canvasNode }: { children?: React.ReactNode; xyNode: Node; canvasNode: CanvasNode }) {

    return <NodeToolbar isVisible={xyNode.selected && !xyNode.dragging}>
        {children}
        <ColorSelector canvasNode={canvasNode} />
    </NodeToolbar>;

}

export default memo(CanvasNodeToolbar);