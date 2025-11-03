import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Authenticated, Unauthenticated } from "convex/react";
import SignInPage from '../pages/SignInPage'
import type { ConvexReactClient } from 'convex/react';

export interface RouterContext {
    convex: ConvexReactClient;
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
