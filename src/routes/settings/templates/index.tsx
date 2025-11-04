import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { NodeTemplate } from "../../../types";
import { useState } from "react";
import Modal from "../../../components/modal/Modal";
import NodeEditor from "../../../components/node-editor/NodeEditor";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/settings/templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const userTemplates = useQuery(api.templates.getUserTemplates) as
    | NodeTemplate[]
    | undefined;

  const [editingTemplateId, setEditingTemplateId] = useState<Id<"nodeTemplates"> | "new" | null>(
    null
  );

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
        {userTemplates.map((template, i) => (
          <div key={i} className="border border-gray-300 p-4 rounded-md cursor-pointer" onClick={() => setEditingTemplateId(template._id)}>
            <h3 className="text-lg font-semibold">{template.name}</h3>
            <p className="text-sm text-gray-500">{template.description}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 border-b border-gray-300 pb-5">
        <h2 className="text-3xl font-semibold">Templates</h2>
        <p className="italic">Créez et gérer vos blocs personnalisés ici.</p>
      </div>

      <div>{renderUserTemplates()}</div>

      {editingTemplateId && <Modal
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
      </Modal>}
    </>
  );
}
