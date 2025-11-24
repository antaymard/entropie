import { useNodeSidePanel } from "./NodeSidePanelContext";
import { HiMiniXMark } from "react-icons/hi2";

export default function SidePanelFrame({
  children,
  sidePanelId,
  sidePanelTitle,
}: {
  children: React.ReactNode;
  sidePanelId: string;
  sidePanelTitle: string;
}) {
  const { closeSidePanel } = useNodeSidePanel();

  return (
    <div className="space-y-2 rounded border border-gray-300 bg-white">
      <div className="flex items-center justify-between p-2 pb-0">
        <h3 className="font-semibold">{sidePanelTitle}</h3>
        <button
          className="hover:bg-white/70 rounded-xs aspect-square"
          type="button"
          onClick={() => closeSidePanel(sidePanelId)}
        >
          <HiMiniXMark size={18} />
        </button>
      </div>
      <div className="p-2 space-y-2">{children}</div>
    </div>
  );
}
