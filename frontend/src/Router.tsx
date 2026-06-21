import { Container, Loader } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';

import {
  type SupabaseAuthContext,
  SupabaseProvider,
  useAuth,
} from './api/supabase.tsx';

// Import the generated route tree
import { routeTree } from './routeTree.gen.ts';

const client = new QueryClient();

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    queryClient: client,
    auth: {
      loading: false,
      error: null,
      isAuthenticated: false,
      session: null,
      callback: async () => {},
      oauth: async () => {},
      login: async () => {},
      logout: async () => {},
      signup: async () => {},
    } satisfies SupabaseAuthContext,
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const SupabaseRouter = () => {
  const auth = useAuth();
  if (!auth.ready || auth.loading) {
    return (
      <Container>
        <Loader size='sm' type='dots' />
      </Container>
    );
  }
  return <RouterProvider router={router} context={{ auth }} />;
};

export const Router = () => (
  <QueryClientProvider client={client}>
    <SupabaseProvider>
      <SupabaseRouter />
    </SupabaseProvider>
  </QueryClientProvider>
);
