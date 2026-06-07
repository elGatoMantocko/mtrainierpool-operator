import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { SupabaseAuthContext } from '../api/supabase.tsx';
import { usePeriodicSync } from '../hooks.ts';

const RootLayout = () => {
  const { queryClient } = Route.useRouteContext();
  usePeriodicSync();
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
      <ReactQueryDevtools client={queryClient} />
    </>
  );
};

interface RouterContext {
  queryClient: QueryClient;
  auth: SupabaseAuthContext;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
