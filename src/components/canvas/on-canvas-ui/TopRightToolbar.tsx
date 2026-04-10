import { Button } from "@/components/shadcn/button";
import { TbCloudCheck, TbCloudUp, TbCloudX } from "react-icons/tb";
import { HiOutlineCog } from "react-icons/hi";
import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useConvexAuth } from "convex/react";
import SharingModal from "./SharingModal";
import { useTranslation } from "react-i18next";

function TopRightToolbar() {
  const { t } = useTranslation();
  const { isAuthenticated } = useConvexAuth();
  if (!isAuthenticated) return null;

  return (
    <div className="canvas-ui-container">
      <div className="px-2">
        <CanvasStatus />
      </div>
      <SharingModal />
      <Button variant="ghost" size="icon-sm" asChild>
        <Link
          to="/settings"
          className="hover:bg-accent flex items-center rounded-md"
          title={t("settings.settings")}
        >
          <HiOutlineCog size={18} />
        </Link>
      </Button>
    </div>
  );
}

function CanvasStatus() {
  const { t } = useTranslation();
  const status = useCanvasStore((state) => state.status);
  const size = 16;

  switch (status) {
    case "idle":
    case "saved":
      return (
        <span className="text-green-500" title={t("canvas.synced")}>
          <TbCloudCheck size={size} />
        </span>
      );
    case "unsynced":
    case "saving":
      return (
        <span className="text-yellow-500" title="Saving...">
          <TbCloudUp size={size} />
        </span>
      );
    case "error":
      return (
        <span className="text-red-500" title={t("canvas.syncError")}>
          <TbCloudX size={size} />
        </span>
      );
    default:
      return null;
  }
}

export default memo(TopRightToolbar);
