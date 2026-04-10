import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCanvasStore } from "@/stores/canvasStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { toastError } from "@/components/utils/errorUtils";
import toast from "react-hot-toast";
import { TbTrash } from "react-icons/tb";
import { useTranslation } from "react-i18next";

export default function SharingModal() {
  const { t } = useTranslation();
  const canvas = useCanvasStore((state) => state.canvas);
  const [open, setOpen] = useState(false);

  if (!canvas || canvas._permission !== "owner") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-accent flex items-center rounded-md"
          title={t("sharing.shareCanvas")}
        >
          {t("common.share")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sharing.shareCanvas")}</DialogTitle>
        </DialogHeader>
        <PublicLinkSection
          canvasId={canvas._id}
          isPublic={canvas.isPublic ?? false}
        />
        <Separator />
        <ShareForm canvasId={canvas._id} />
        <ShareList canvasId={canvas._id} />
      </DialogContent>
    </Dialog>
  );
}

function PublicLinkSection({
  canvasId,
  isPublic,
}: {
  canvasId: Id<"canvases">;
  isPublic: boolean;
}) {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const togglePublic = useMutation(api.canvases.togglePublic);

  const handlePublicToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await togglePublic({
        canvasId,
        isPublic: checked,
      });
      toast.success(
        checked ? t("sharing.canvasPublic") : t("sharing.canvasPrivate"),
      );
    } catch (err) {
      toastError(err, t("sharing.failedUpdate"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("sharing.linkCopied"));
    } catch (err) {
      toastError(err, t("sharing.failedCopy"));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="public-canvas-switch">{t("sharing.publicLink")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("sharing.anyoneCanView")}
          </p>
        </div>
        <Switch
          id="public-canvas-switch"
          checked={isPublic}
          onCheckedChange={handlePublicToggle}
          disabled={isUpdating}
        />
      </div>
      {isPublic && (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
          >
            {t("sharing.copyLink")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ShareForm({ canvasId }: { canvasId: Id<"canvases"> }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"viewer" | "editor">("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shareCanvas = useMutation(api.shares.shareCanvas);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await shareCanvas({
        canvasId,
        email: email.trim(),
        permission,
      });
      setEmail("");
    } catch (err) {
      toastError(err, t("sharing.failedShare"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="share-email">{t("common.email")}</Label>
        <Input
          id="share-email"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label>{t("sharing.permission")}</Label>
          <Select
            value={permission}
            onValueChange={(v) => setPermission(v as "viewer" | "editor")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">{t("sharing.viewer")}</SelectItem>
              <SelectItem value="editor">{t("sharing.editor")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? t("sharing.sharing") : t("common.share")}
        </Button>
      </div>
    </form>
  );
}

function ShareList({ canvasId }: { canvasId: Id<"canvases"> }) {
  const { t } = useTranslation();
  const shares = useQuery(api.shares.listCanvasShares, {
    canvasId,
  });
  const unshareCanvas = useMutation(api.shares.unshareCanvas);

  if (!shares || shares.length === 0) return null;

  const handleRemove = async (shareId: Id<"shares">) => {
    try {
      await unshareCanvas({ shareId });
    } catch (err) {
      toastError(err, t("sharing.failedRemove"));
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <Label className="text-muted-foreground text-xs">{t("sharing.sharedWith")}</Label>
      <div className="flex flex-col divide-y">
        {shares.map((share) => (
          <div
            key={share._id}
            className="flex items-center justify-between py-2"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{share.userName}</span>
              {share.userEmail && (
                <span className="text-xs text-muted-foreground">
                  {share.userEmail}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground capitalize">
                {share.permission}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(share._id)}
                title={t("sharing.removeAccess")}
              >
                <TbTrash size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
