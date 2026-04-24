import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/shadcn/button";
import { Dialog } from "@/components/shadcn/dialog";
import SkillsList from "@/components/settings/skills/SkillsList";
import SkillEditor from "@/components/settings/skills/SkillEditor";
import SkillCreateDialog from "@/components/settings/skills/SkillCreateDialog";

export const Route = createFileRoute("/settings/skills")({
  component: SkillsSettingsPage,
});

function SkillsSettingsPage() {
  const skills = useQuery(api.skills.list);
  const [selectedId, setSelectedId] = useState<Id<"skills"> | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreated = (newId: Id<"skills">) => {
    setSelectedId(newId);
    setIsCreateOpen(false);
  };

  const handleDeleted = () => {
    setSelectedId(null);
  };

  return (
    <div className="grid grid-cols-[320px_1fr] gap-6 h-full">
      <div className="flex flex-col gap-3 min-h-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Skills</h1>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            New skill
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Skills are reusable prompt modules Nolë can load on demand. The
          frontmatter <code>name</code> &amp; <code>description</code> drive
          discovery; the body is the full prompt.
        </p>
        <div className="overflow-y-auto pr-1 flex-1">
          {skills === undefined ? (
            <p className="text-sm text-gray-500 italic px-2">Loading…</p>
          ) : (
            <SkillsList
              skills={skills}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>

      <div className="border-l border-gray-200 pl-6 min-h-0">
        {selectedId ? (
          <SkillEditor skillId={selectedId} onDeleted={handleDeleted} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Select a skill on the left, or create a new one.
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SkillCreateDialog
          onCreated={handleCreated}
          onClose={() => setIsCreateOpen(false)}
        />
      </Dialog>
    </div>
  );
}
