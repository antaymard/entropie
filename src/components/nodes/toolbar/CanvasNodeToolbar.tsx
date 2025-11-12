import { NodeToolbar, type Node } from "@xyflow/react";
import { memo } from "react";
import ColorSelector from "./ColorSelector";

function CanvasNodeToolbar({ children, xyNode }: { children?: React.ReactNode; xyNode: Node; }) {

    return <NodeToolbar isVisible={xyNode.selected && !xyNode.dragging}>
        {children}
        <ColorSelector xyNode={xyNode} />
    </NodeToolbar>;

}

export default memo(CanvasNodeToolbar);