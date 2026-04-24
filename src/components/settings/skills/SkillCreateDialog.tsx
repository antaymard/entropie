import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/shadcn/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { toastError } from "@/components/utils/errorUtils";
import { NEW_SKILL_TEMPLATE } from "./skillSerialization";

type SkillCreateDialogProps = {
  onCreated: (skillId: Id<"skills">) => void;
  onClose: () => void;
};

export default function SkillCreateDialog({
  onCreated,
  onClose,
}: SkillCreateDialogProps) {
  const createSkill = useMutation(api.skills.create);
  const [raw, setRaw] = useState<string>(NEW_SKILL_TEMPLATE);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raw.trim()) {
      toast.error("Skill content is required.");
      return;
    }
    setIsSaving(true);
    try {
      const newId = await createSkill({ rawContent: raw });
      toast.success("Skill created.");
      onCreated(newId);
    } catch (error) {
      toastError(error, "Failed to create skill.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>New skill</DialogTitle>
          <DialogDescription>
            Paste raw skill markdown. The frontmatter (<code>---</code>) at the
            top must define <code>name</code> and <code>description</code>.
          </DialogDescription>
        </DialogHeader>

        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="my-3 w-full font-mono text-xs border rounded-md px-3 py-2 bg-white min-h-[280px]"
        />

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
