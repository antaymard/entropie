import { createContext, useContext } from "react";

interface WindowFrameContextValue {
  setDirty: (isDirty: boolean) => void;
  setSaveHandler: (fn: (() => void) | null) => void;
}

const WindowFrameContext = createContext<WindowFrameContextValue>({
  setDirty: () => {},
  setSaveHandler: () => {},
});

export function useWindowFrameContext() {
  return useContext(WindowFrameContext);
}

export { WindowFrameContext };
