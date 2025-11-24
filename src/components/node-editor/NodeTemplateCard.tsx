import type { NodeTemplate } from "@/types";
import type { Id } from "@/../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../shadcn/dropdown-menu";
import { Button } from "../shadcn/button";
import { FiMoreVertical } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi";
import { api } from "@/../convex/_generated/api";

export default function NodeTemplateCard({
  template,
  editTemplate,
}: {
  template: NodeTemplate;
  editTemplate: React.Dispatch<
    React.SetStateAction<Id<"nodeTemplates"> | "new" | null>
  >;
}) {
  const deleteTemplate = useMutation(api.templates.deleteTemplate);

  return (
    <div className="flex items-center justify-between border border-gray-300  rounded-md cursor-pointer pr-4">
      <div
        onClick={() => editTemplate(template._id as Id<"nodeTemplates">)}
        className="flex-1 p-4"
      >
        <h3 className="text-lg font-semibold">{template.name}</h3>
        <p className="text-sm text-gray-500">{template.description}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <FiMoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              deleteTemplate({
                templateId: template._id as Id<"nodeTemplates">,
              })
            }
          >
            <HiOutlineTrash />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
