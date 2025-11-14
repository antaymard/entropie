import { useWindowsStore } from "@/stores/windowsStore";
import MinimizedWindow from "./MinimizedWindow";
import { FaRegCircleXmark } from "react-icons/fa6";

export default function WindowsBottomBar() {
  const openWindows = useWindowsStore((state) => state.openWindows);
  const closeAllWindows = useWindowsStore((state) => state.closeAllWindows);

  if (openWindows.length === 0) return null;
  return (
    <div className="flex gap-3 p-1 rounded-md bg-white shadow">
      <div className="flex gap-2">
        {openWindows.map((window) => (
          <MinimizedWindow key={window.id} window={window}></MinimizedWindow>
        ))}
      </div>
      <button
        type="button"
        onClick={closeAllWindows}
        className="text-pink-300 hover:text-pink-500"
      >
        <FaRegCircleXmark size={18} />
      </button>
    </div>
  );
}
