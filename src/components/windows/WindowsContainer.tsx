import { useWindowsStore } from "@/stores/windowsStore";
import WindowFrame from "./WindowFrame";
import prebuiltNodesConfig from "../nodes/prebuilt-nodes/prebuiltNodesConfig";
import CustomWindow from "./CustomWindow";

export default function WindowsContainer() {
  const openWindows = useWindowsStore((state) => state.openWindows);

  const openWindow = openWindows[0];
  if (!openWindow) return null;

  function renderOpenWindows() {
    // Pour les nodes custom (avec template), utilise CustomWindow
    if (openWindow.type === "custom") {
      return <CustomWindow key={openWindow.id} windowId={openWindow.id} />;
    }

    // Récupère la config du node prebuilt pour trouver le windowComponent
    const nodeConfig = prebuiltNodesConfig.find(
      (config) => config.type === openWindow.type
    );

    // Si un windowComponent est défini, l'utilise
    if (nodeConfig?.windowComponent) {
      const WindowComponent = nodeConfig.windowComponent;
      return <WindowComponent key={openWindow.id} windowId={openWindow.id} />;
    }

    // Fallback: WindowFrame vide
    return (
      <WindowFrame key={openWindow.id} windowId={openWindow.id}>
        {/* Contenu par défaut si pas de windowComponent */}
      </WindowFrame>
    );
  }

  return (
    <div className="flex h-screen w-32 bg-primary">{renderOpenWindows()}</div>
  );
}
