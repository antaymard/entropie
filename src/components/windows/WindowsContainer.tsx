import { useWindowsStore } from "@/stores/windowsStore";
import WindowFrame from "./WindowFrame";

export default function WindowsContainer() {
  const openWindows = useWindowsStore((state) => state.openWindows);

  return (
    <div className="fixed top-0 left-0 h-screen w-screen pointer-events-none">
      {openWindows.map((window) => (
        <WindowFrame key={window.id} windowId={window.id} />
      ))}
    </div>
  );
}
