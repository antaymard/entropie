import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient } from '@tanstack/react-query';
import { ConvexQueryClient } from '@convex-dev/react-query';
import type { RouterContext } from './routes/__root'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const queryClient = new QueryClient();
const convexQueryClient = new ConvexQueryClient(convex);

// Connecter le QueryClient au ConvexQueryClient
convexQueryClient.connect(queryClient);

// Configurer le queryFn global pour les queries Convex
queryClient.setDefaultOptions({
  queries: {
    queryFn: convexQueryClient.queryFn(),
  },
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    convexQueryClient,
  } satisfies RouterContext
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
  interface RouterContext {
    queryClient: QueryClient
    convexQueryClient: ConvexQueryClient
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <ConvexAuthProvider client={convex}>
        <RouterProvider router={router} />
      </ConvexAuthProvider>
    </StrictMode>,
  )
}
