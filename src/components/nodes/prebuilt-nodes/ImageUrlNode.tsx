import { useCanvasStore } from "@/stores/canvasStore";
import { type Node } from "@xyflow/react";
import { memo, useCallback } from "react";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";

function ImageUrlNode(xyNode: Node) {

    const handleUrlChange = useCallback((newUrl: string) => {
        // updateNodeData(xyNode.id, { url: newUrl });
    }, [xyNode.id, updateNodeData]);


    if (!canvasNode) return "null";
    return <>
        <CanvasNodeToolbar xyNode={xyNode} />
        <NodeFrame xyNode={xyNode} showName>
            <img
                src={canvasNode.data.url as string}
            />
        </NodeFrame>
    </>;
}

export default memo(ImageUrlNode);