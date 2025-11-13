import { useMutation } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useCanvasStore } from "../../stores/canvasStore";
import { Link } from "@tanstack/react-router";
import { HiOutlineCog } from "react-icons/hi";
import { TbLayoutSidebarLeftExpand } from "react-icons/tb";
import { useSidebar } from "../shadcn/sidebar";
import InlineEditableText from "../common/InlineEditableText";

export default function CanvasTopBar() {
  const canvas = useCanvasStore((state) => state.canvas);
  const { setOpen } = useSidebar();

  const updateCanvasDetails = useMutation(api.canvases.updateCanvasDetails);

  const handleUpdateCanvasDetails = async (newName: string) => {
    await updateCanvasDetails({
      canvasId: canvas?._id as Id<"canvases">,
      name: newName,
    });
  };

  return (
    <>
      <div className="h-15 flex items-center justify-between px-4 border-b border-gray-300 bg-white ">
        <div className="rounded-sm border border-gray-300 flex divide-x divide-gray-300">
          <button
            className="hover:bg-gray-200 p-2 flex items-center rounded-xs"
            title="Espaces"
            type="button"
            onClick={() => setOpen(true)}
          >
            <TbLayoutSidebarLeftExpand size={18} />
          </button>
          <Link
            to="/settings"
            className="hover:bg-gray-200 p-2 flex items-center rounded-xs"
            title="Paramètres"
          >
            <HiOutlineCog size={18} />
          </Link>
        </div>
        <InlineEditableText
          value={canvas?.name || "Sans nom"}
          onSave={handleUpdateCanvasDetails}
          as="h1"
          textClassName="font-semibold hover:text-black text-lg"
          placeholder="Sans nom"
        />
        <div>

        </div>
      </div>
    </>
  );
}
