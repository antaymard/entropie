import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/shadcn/button";
import { toastError } from "@/components/utils/errorUtils";
import SkillAttachments from "./SkillAttachments";
import { buildRawSkillContent } from "./skillSerialization";

type SkillEditorProps = {
  skillId: Id<"skills">;
  onDeleted: () => void;
};

export default function SkillEditor({ skillId, onDeleted }: SkillEditorProps) {
  const skill = useQuery(api.skills.read, { skillId });
  const updateSkill = useMutation(api.skills.update);
  const removeSkill = useMutation(api.skills.remove);

  const [draft, setDraft] = useState<string>("");
  const [hydratedFor, setHydratedFor] = useState<Id<"skills"> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!skill) return;
    if (hydratedFor === skill._id) return;
    setDraft(
      buildRawSkillContent({
        name: skill.name,
        description: skill.description,
        body: skill.content,
      }),
    );
    setHydratedFor(skill._id);
  }, [skill, hydratedFor]);

  if (skill === undefined) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading…
      </div>
    );
  }

  if (skill === null) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Skill not found.
      </div>
    );
  }

  const readOnly = skill.isSystem && skill.userId === undefined;
  const isOwn = !readOnly;

  const handleSave = async () => {
    if (!isOwn) return;
    setIsSaving(true);
    try {
      await updateSkill({ skillId: skill._id, rawContent: draft });
      toast.success("Skill saved.");
    } catch (error) {
      toastError(error, "Failed to save skill.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwn) return;
    if (!confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await removeSkill({ skillId: skill._id });
      toast.success(`Skill "${skill.name}" deleted.`);
      onDeleted();
    } catch (error) {
      toastError(error, "Failed to delete skill.");
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">{skill.name}</h2>
          <p className="text-sm text-gray-500">{skill.description}</p>
          {readOnly && (
            <span className="mt-1 inline-block self-start text-xs uppercase tracking-wide bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
              System (read-only)
            </span>
          )}
        </div>
        {isOwn && (
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="skill-raw"
          className="text-sm font-semibold text-gray-700"
        >
          Skill source
        </label>
        <textarea
          id="skill-raw"
          value={draft}
          readOnly={readOnly}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full font-mono text-xs border rounded-md px-3 py-2 bg-white min-h-[320px] flex-1"
        />
        <p className="text-xs text-gray-500">
          Front-matter (<code>---</code>) at the top defines{" "}
          <code>name</code> and <code>description</code>. The body below is the
          full prompt loaded by Nolë.
        </p>
      </div>

      <SkillAttachments
        skillId={skill._id}
        attachments={skill.attachments}
        readOnly={readOnly}
      />
    </div>
  );
}
