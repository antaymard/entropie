import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { NodeTemplate } from "../types/node.types";
import type { Id } from "convex/_generated/dataModel";

interface TemplateStore {
  templates: NodeTemplate[];

  setTemplates: (templates: NodeTemplate[]) => void;

  getTemplateById: (id: string) => NodeTemplate | undefined;
}

export const useTemplateStore = create<TemplateStore>()(
  devtools(
    (set, get) => ({
      templates: [],

      setTemplates: (templates) => set({ templates }),

      getTemplateById: (id) => {
        return get().templates.find((t) => t._id === id);
      },
    }),
    { name: "template-store" }
  )
);

// Hook helper pour récupérer un template spécifique (optimisé)
export const useTemplate = (
  templateId: Id<"nodeTemplates"> | undefined
): NodeTemplate | undefined => {
  return useTemplateStore((state) =>
    templateId ? state.templates.find((t) => t._id === templateId) : undefined
  );
};
