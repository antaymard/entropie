import { useWindowsStore } from "@/stores/windowsStore";
import WindowFrame from "./WindowFrame";
import prebuiltNodesConfig from "../nodes/prebuilt-nodes/prebuiltNodesConfig";
import CustomWindow from "./CustomWindow";

export default function SidePanelWindowsContainer() {
  const openWindows = useWindowsStore((state) => state.openWindows);

  return (
    <div className="">
      {openWindows
        .filter((window) => !window.isMinimized)
        .map((window) => {
          // Pour les nodes custom (avec template), utilise CustomWindow
          if (window.type === "custom") {
            return <CustomWindow key={window.id} windowId={window.id} />;
          }

          // Récupère la config du node prebuilt pour trouver le windowComponent
          const nodeConfig = prebuiltNodesConfig.find(
            (config) => config.type === window.type
          );

          // Si un windowComponent est défini, l'utilise
          if (nodeConfig?.windowComponent) {
            const WindowComponent = nodeConfig.windowComponent;
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
