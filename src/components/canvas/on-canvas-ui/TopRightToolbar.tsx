import { Button } from "@/components/shadcn/button";
import { TbCloudCheck, TbCloudUp, TbCloudX } from "react-icons/tb";
import { HiOutlineCog } from "react-icons/hi";
import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toastError } from "@/components/utils/errorUtils";

function TopRightToolbar() {
  const { isAuthenticated } = useConvexAuth();
  if (!isAuthenticated) return null;

  return (
    <div className="h-12 flex items-center gap-2">
      <div className="bg-white px-2 rounded h-full border border-gray-300 flex items-center gap-2">
        <div className="px-2">
          <CanvasStatus />
        </div>
        <SharingButton />
        <Button variant="ghost" asChild>
          <Link
            to="/settings"
            className="hover:bg-accent p-2 flex items-center rounded-md"
            title="Settings"
          >
            <HiOutlineCog size={18} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SharingButton() {
  const canvas = useCanvasStore((state) => state.canvas);
  const updateCanvas = useCanvasStore((state) => state.updateCanvas);

  const updateCanvasDetails = useMutation(api.canvases.updateCanvasDetails);

  if (!canvas) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="hover:bg-accent p-2 flex items-center rounded-md"
          title="Share canvas"
        >
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="flex items-center gap-3">
          <Switch
            checked={canvas?.sharingOptions?.isPubliclyReadable ?? false}
            onCheckedChange={(checked) => {
              updateCanvas({
                sharingOptions: { isPubliclyReadable: checked },
              });
              updateCanvasDetails({
                canvasId: canvas._id,
                sharingOptions: { isPubliclyReadable: checked },
              }).catch((err) => {
                toastError(
                  err,
                  "Error updating sharing options"
                );
                // Revert the change in case of error
                updateCanvas({
                  sharingOptions: {
                    isPubliclyReadable: !checked,
                  },
                });
              });
            }}
          />
          <Label>Make public (read-only)</Label>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CanvasStatus() {
  const status = useCanvasStore((state) => state.status);
  const size = 20;

  switch (status) {
    case "idle":
      return (
        <span className="text-sm text-gray-500" title="Synced">
          <TbCloudCheck size={size} />
        </span>
      );
    case "unsynced":
      return (
        <span className="text-sm text-yellow-500" title="Not synced">
          <TbCloudUp size={size} />
        </span>
      );
    case "saving":
      return (
        <span className="text-sm text-blue-500" title="Saving">
          <TbCloudUp size={size} />
        </span>
      );
    case "saved":
      return (
        <span className="text-sm text-green-500" title="Saved">
          <TbCloudCheck size={size} />
        </span>
      );
    case "error":
      return (
        <span
          className="text-sm text-red-500"
          title="Sync error"
        >
          <TbCloudX size={size} />
        </span>
      );
    default:
      return null;
  }
}

export default memo(TopRightToolbar);
