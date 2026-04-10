import { useForm } from "@tanstack/react-form";
import TextInput from "@/components/ts-form/TextInput";
import toast from "react-hot-toast";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { toastError } from "../utils/errorUtils";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { useTranslation } from "react-i18next";

export default function CanvasCreationModal() {
  const { t } = useTranslation();
  const createCanvas = useMutation(api.canvases.createCanvas);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) return;
      try {
        const newCanvasId = await createCanvas({ name: value.name });
        if (newCanvasId) {
          toast.success(t("workspace.createdSuccess", { name: value.name }));
          navigate({
            to: `/canvas/${newCanvasId}`,
            params: { canvasId: newCanvasId },
          });
        } else {
          throw new Error("Failed to create workspace.");
        }
      } catch (error) {
        toastError(error, t("workspace.createError"));
      }
    },
  });

  return (
    <DialogContent>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("workspace.create")}</DialogTitle>
          <DialogDescription>{t("workspace.giveName")}</DialogDescription>
        </DialogHeader>
        <div className="my-3">
          <TextInput
            form={form}
            name="name"
            label={t("workspace.nameLabel")}
            placeholder=""
            validators={{
              onChange: ({ value }: { value: string }) =>
                !value.trim() ? t("workspace.nameEmpty") : undefined,
            }}
          />
        </div>
        <DialogFooter>
          <Button type="submit">{t("common.create")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
