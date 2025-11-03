import { NodeResizer } from "@xyflow/react";
import { memo } from "react";

function NodeFrame() {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={100} isVisible={false} />
      <div>Node Frame</div>
    </>
  );
}

export default memo(NodeFrame);
