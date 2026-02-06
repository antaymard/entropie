import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { RouterContext } from "./routes/__root";
import { Toaster } from "react-hot-toast";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const router = createRouter({
  routeTree,
  context: {
    convex,
  } satisfies RouterContext,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Toaster />
      <ConvexAuthProvider client={convex}>
        <RouterProvider router={router} />
      </ConvexAuthProvider>
    </StrictMode>,
  );
}
