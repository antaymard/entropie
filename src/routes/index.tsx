import { createFileRoute, redirect } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import CanvasTopBar from "../components/canvas/CanvasTopBar";
import type { RouterContext } from "./__root";
import { VscGithubProject } from "react-icons/vsc";
import { useState } from "react";
import CanvasCreationModal from "../components/canvas/CanvasCreationModal";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const { convex } = context as RouterContext;

    // Récupérer le dernier canvas modifié (appel ponctuel, pas de subscription)
    const lastCanvas = await convex.query(
      api.canvases.getLastModifiedCanvas,
      {}
    );

    if (lastCanvas) {
      throw redirect({
        to: "/canvas/$canvasId",
        params: { canvasId: lastCanvas._id },
      });
    }
    // Si aucun canvas n'existe, on reste sur la page d'accueil
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Placeholder for modal state

  return (
    <div className="h-screen w-screen bg-gray-100">
      <CanvasTopBar />
      <div className="flex flex-col items-center justify-center h-full gap-5">
        <p className="text-gray-500">
          Aucun espace trouvé. Créez-en un nouveau !
        </p>
        <button
          type="button"
          className="flex items-center gap-2 bg-violet-500 px-3 py-2 rounded-md text-white hover:bg-violet-600"
          onClick={() => {
            setIsModalOpen(true);
          }}
        >
          <VscGithubProject />
          Créer un espace
        </button>
      </div>
      <CanvasCreationModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
}
