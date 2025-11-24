import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { NodeTemplate } from "../../../types";
import { useState } from "react";
import Modal from "../../../components/modal/Modal";
import NodeEditor from "../../../components/node-editor/NodeEditor";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/shadcn/button";
import NodeTemplateCard from "@/components/node-editor/NodeTemplateCard";

export const Route = createFileRoute("/settings/templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const userTemplates = useQuery(api.templates.getUserTemplates) as
    | NodeTemplate[]
    | undefined;

  const [editingTemplateId, setEditingTemplateId] = useState<
    Id<"nodeTemplates"> | "new" | null
  >(null);

  function renderUserTemplates() {
    if (userTemplates === undefined) return <i>Chargement des templates...</i>;
    if (userTemplates.length === 0)
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p>Aucun template de bloc trouvé.</p>
          <button
            className="text-blue-500 underline"
            onClick={() => setEditingTemplateId("new")}
          >
            Créer un nouveau template
          </button>
        </div>
      );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userTemplates.map((template: NodeTemplate, i) => (
          <NodeTemplateCard
            template={template}
            key={i}
            editTemplate={setEditingTemplateId}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 pb-5 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Templates</h2>
          <p className="italic text-sm">
            Créez et gérer vos blocs personnalisés ici.
          </p>
        </div>
        <Button onClick={() => setEditingTemplateId("new")}>
          Créer un nouveau template
        </Button>
      </div>

      <div>{renderUserTemplates()}</div>

      {editingTemplateId && (
        <Modal
          isModalOpen
          clickOutsideToClose={false}
          close={() => setEditingTemplateId(null)}
          modalStyle={{
            width: "100%",
            height: "100%",
          }}
          modalTitle={editingTemplateId === "new" ? "Nouveau template" : "TODO"}
        >
          <NodeEditor templateId={editingTemplateId} />
        </Modal>
      )}
    </>
  );
}
