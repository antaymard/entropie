import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { NodeTemplate } from "../../../types";
import { useState } from "react";
import Modal from "../../../components/modal/Modal";
import NodeEditor from "../../../components/node-editor/NodeEditor";

export const Route = createFileRoute("/settings/templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const userTemplates = useQuery(api.templates.getUserTemplates) as
    | NodeTemplate[]
    | undefined;

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
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
      <ul>
        {userTemplates.map((template) => (
          <li key={template.id}>{template.name}</li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="mb-8 border-b border-gray-300 pb-5">
        <h2 className="text-3xl font-semibold">Templates</h2>
        <p className="italic">Créez et gérer vos blocs personnalisés ici.</p>
      </div>

      <div>{renderUserTemplates()}</div>

      <Modal
        isModalOpen={editingTemplateId !== null}
        clickOutsideToClose={false}
        close={() => setEditingTemplateId(null)}
        modalStyle={{
          width: "100%",
          height: "100%",
        }}
        modalTitle={editingTemplateId === "new" ? "Nouveau template" : "TODO"}
      >
        <NodeEditor />
      </Modal>
    </>
  );
}
