import { Authenticated, Unauthenticated, useQuery } from "convex/react";

import NodeEditor from "./components/node-editor/NodeEditor";
import SignInPage from "./pages/SignInPage";
import CanvasPage from "./pages/CanvasPage";
function App() {
  return (
    <div className="h-screen w-screen">
      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
      <Authenticated>
        <CanvasPage />
      </Authenticated>
    </div>
  );
}

export default App;
