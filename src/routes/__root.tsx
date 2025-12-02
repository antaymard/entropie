import {
  Outlet,
  createRootRoute,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useConvexAuth } from "convex/react";
import type { ConvexReactClient } from "convex/react";
import { useEffect } from "react";

export interface RouterContext {
  convex: ConvexReactClient;
}

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== "/signin") {
      navigate({ to: "/signin" });
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <Outlet />
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </div>
  );
}
