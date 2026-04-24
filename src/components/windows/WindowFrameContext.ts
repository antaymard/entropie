import { createContext, useContext } from "react";

interface WindowFrameContextValue {
  setDirty: (isDirty: boolean) => void;
  setSaveHandler: (fn: (() => void) | null) => void;
  setRefreshHandler: (fn: (() => void) | null) => void;
}

const WindowFrameContext = createContext<WindowFrameContextValue>({
  setDirty: () => {},
  setSaveHandler: () => {},
  setRefreshHandler: () => {},
});

export function useWindowFrameContext() {
  return useContext(WindowFrameContext);
}

export { WindowFrameContext };
