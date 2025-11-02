import { createFileRoute, redirect } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../convex/_generated/api';
import CanvasTopBar from "../components/canvas/CanvasTopBar";
import type { RouterContext } from './__root';

export const Route = createFileRoute('/')({
    beforeLoad: async ({ context }) => {
        const { queryClient } = context as RouterContext;

        // Récupérer le dernier canvas modifié
        const lastCanvas = await queryClient.fetchQuery(
            convexQuery(api.canvases.getLastModifiedCanvas, {})
        );

        if (lastCanvas) {
            throw redirect({
                to: '/canvas/$canvasId',
                params: { canvasId: lastCanvas._id }
            });
        }
        // Si aucun canvas n'existe, on reste sur la page d'accueil
    },
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className="h-screen w-screen bg-gray-100">
            <CanvasTopBar />
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Aucun canvas trouvé. Créez-en un nouveau !</p>
            </div>
        </div>
    );
}


