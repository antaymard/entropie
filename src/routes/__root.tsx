import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Authenticated, Unauthenticated } from "convex/react";
import SignInPage from '../pages/SignInPage'
import { QueryClient } from '@tanstack/react-query';
import { ConvexQueryClient } from '@convex-dev/react-query';

export interface RouterContext {
    queryClient: QueryClient;
    convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <div className="h-screen w-screen">
            <Unauthenticated>
                <SignInPage />
            </Unauthenticated>
            <Authenticated>
                <Outlet />
            </Authenticated>
            <TanStackRouterDevtools position="bottom-right" />
        </div>
    )
}
