import { cn } from "@/lib/utils";
import type { Doc } from "@/../convex/_generated/dataModel";

type SkillSummary = {
  _id: Doc<"skills">["_id"];
  name: string;
  description: string;
  isSystem: boolean;
  isOwn: boolean;
};

type SkillsListProps = {
  skills: SkillSummary[];
  selectedId: SkillSummary["_id"] | null;
  onSelect: (id: SkillSummary["_id"]) => void;
};

export default function SkillsList({
  skills,
  selectedId,
  onSelect,
}: SkillsListProps) {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic px-2">No skills yet.</p>
    );
  }

  const own = skills.filter((skill) => skill.isOwn);
  const system = skills.filter((skill) => skill.isSystem && !skill.isOwn);

  const renderGroup = (label: string, items: SkillSummary[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-gray-500 uppercase pl-2">
          {label}
        </h4>
        <div className="divide-y divide-gray-200 border border-gray-200 bg-white rounded-md overflow-hidden">
          {items.map((skill) => (
            <button
              key={skill._id}
              type="button"
              onClick={() => onSelect(skill._id)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors flex flex-col gap-0.5",
                selectedId === skill._id && "bg-violet-50 hover:bg-violet-100",
              )}
            >
              <span className="font-medium text-sm truncate">{skill.name}</span>
              <span className="text-xs text-gray-500 line-clamp-2">
                {skill.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderGroup("Your skills", own)}
      {renderGroup("System skills", system)}
    </div>
  );
}

export type { SkillSummary };
