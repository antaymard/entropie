import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import { useNoleStore } from "@/stores/noleStore";
import { HiMiniXMark } from "react-icons/hi2";
import { LuMousePointer } from "react-icons/lu";

export function AttachmentRenderer() {
  const attachedNodes = useNoleStore((state) => state.attachedNodes);
  const attachedPosition = useNoleStore((state) => state.attachedPosition);
  if (attachedNodes.length === 0 && !attachedPosition) {
    return null;
  }
  return (
    <div className="text-white flex my-1 flex-wrap gap-2">
      {/* Render attachments here */}
      {attachedPosition && (
        <AttachmentCard type="position" data={attachedPosition} />
      )}
      {attachedNodes.map((node) => (
        <AttachmentCard key={node.id} type="node" data={node} />
      ))}
    </div>
  );
}

export function AttachmentCard({
  type,
  data,
}: {
  type: "position" | "node";
  data: any;
}) {
  const removeAttachments = useNoleStore((state) => state.removeAttachments);
  let Icon;
  let label;
  if (type === "node") {
    Icon =
      prebuiltNodesConfig.find((n) => n.type === data.type)?.nodeIcon || null;
    label = data?.data?.name || data.type;
  }
  if (type === "position") {
    Icon = LuMousePointer;
    label = `Position (${data.x.toFixed(0)}, ${data.y.toFixed(0)})`;
  }

  return (
    <div className="group relative flex items-center gap-1 border border-white/20 bg-white/10 rounded-sm text-sm text-white max-w-[200px] truncate p-1">
      {Icon && <Icon size={12} className="min-w-3" />}
      {label}
      <button
        onClick={() =>
          removeAttachments([
            { type, ids: type === "node" ? [data?.id] : undefined },
          ])
        }
        type="button"
        className="absolute top-1 right-1 hidden group-hover:block bg-white text-red-300 rounded-sm "
      >
        <HiMiniXMark size={15} />
      </button>
    </div>
  );
}
