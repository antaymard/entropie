import { Button } from "@/components/shadcn/button";
import { TbCloudCheck, TbCloudUp, TbCloudX } from "react-icons/tb";
import { HiOutlineCog } from "react-icons/hi";
import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useCanvasStore } from "@/stores/canvasStore";

function TopRightToolbar() {
  return (
    <div className="h-12 flex items-center gap-2">
      <div className="bg-white px-2 rounded h-full border border-gray-300 flex items-center gap-2">
        <div className="px-2">
          <CanvasStatus />
        </div>
        <Button variant="ghost" asChild>
          <Link
            to="/settings"
            className="hover:bg-accent p-2 flex items-center rounded-md"
            title="Paramètres"
          >
            <HiOutlineCog size={18} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CanvasStatus() {
  const status = useCanvasStore((state) => state.status);
  const size = 20;

  switch (status) {
    case "idle":
      return (
        <span className="text-sm text-gray-500" title="Synchronisé">
          <TbCloudCheck size={size} />
        </span>
      );
    case "unsynced":
      return (
        <span className="text-sm text-yellow-500" title="Non synchronisé">
          <TbCloudUp size={size} />
        </span>
      );
    case "saving":
      return (
        <span className="text-sm text-blue-500" title="En cours de sauvegarde">
          <TbCloudUp size={size} />
        </span>
      );
    case "saved":
      return (
        <span className="text-sm text-green-500" title="Sauvegardé">
          <TbCloudCheck size={size} />
        </span>
      );
    case "error":
      return (
        <span
          className="text-sm text-red-500"
          title="Erreur de synchronisation"
        >
          <TbCloudX size={size} />
        </span>
      );
    default:
      return null;
  }
}

export default memo(TopRightToolbar);
