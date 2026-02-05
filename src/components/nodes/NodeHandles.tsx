import { cn } from "@/lib/utils";
import {
  Handle,
  Position,
  useConnection,
  type ConnectionState,
} from "@xyflow/react";

export default function NodeHandles({
  hasDataHandles = false,
  showSourceHandles = false,
  nodeId,
}: {
  hasDataHandles?: boolean;
  showSourceHandles?: boolean;
  nodeId: string;
}) {
  const connection = useConnection() as ConnectionState;

  const handles = [
    {
      type: "source" as const,
      position: Position.Left,
      visible: showSourceHandles,
      id: nodeId + "sl",
    },
    {
      type: "source" as const,
      position: Position.Right,
      visible: showSourceHandles,
      id: nodeId + "sr",
    },
    {
      type: "source" as const,
      position: Position.Top,
      visible: showSourceHandles,
      id: nodeId + "st",
    },
    {
      type: "source" as const,
      position: Position.Bottom,
      visible: showSourceHandles,
      id: nodeId + "sb",
    },
    {
      type: "target" as const,
      position: Position.Left,
      visible: connection.inProgress,
      id: nodeId + "tl",
    },
    {
      type: "target" as const,
      position: Position.Right,
      visible: connection.inProgress,
      id: nodeId + "tr",
    },
    {
      type: "target" as const,
      position: Position.Top,
      visible: connection.inProgress,
      id: nodeId + "tt",
    },
    {
      type: "target" as const,
      position: Position.Bottom,
      visible: connection.inProgress,
      id: nodeId + "tb",
    },
  ];

  return (
    <>
      {handles.map((handle) => (
        <Handle
          key={`${handle.type}-${handle.position}`}
          type={handle.type}
          id={handle.id}
          position={handle.position}
          className={cn(handle.visible ? "opacity-100 z-10" : "opacity-0")}
          style={{
            height: 7,
            width: 7,
          }}
        />
      ))}
    </>
  );

  // if (connection.inProgress) {
  //   return (
  //     <>
  //       <Handle type="target" className="z-10" position={Position.Left} />
  //     </>
  //   );
  // }

  return null;
}
