import { useWindowsStore } from "@/stores/windowsStore";
import WindowFrame from "./WindowFrame";
import prebuiltNodesConfig from "../nodes/prebuilt-nodes/prebuiltNodesConfig";

export default function WindowsContainer() {
  const openWindows = useWindowsStore((state) => state.openWindows);

  return (
    <div className="fixed top-0 left-0 h-screen w-screen pointer-events-none">
      {openWindows
        .filter((window) => !window.isMinimized)
        .map((window) => {
          // Récupère la config du node pour trouver le windowComponent
          const nodeConfig = prebuiltNodesConfig.find(
            (config) => config.type === window.type
          );

          // Si un windowComponent est défini, l'utilise, sinon utilise WindowFrame par défaut
          const WindowComponent = nodeConfig?.windowComponent;

          if (WindowComponent) {
            return <WindowComponent key={window.id} windowId={window.id} />;
          }

          // Fallback: WindowFrame vide
          return (
            <WindowFrame key={window.id} windowId={window.id}>
              {/* Contenu par défaut si pas de windowComponent */}
            </WindowFrame>
          );
        })}
    </div>
  );
}
