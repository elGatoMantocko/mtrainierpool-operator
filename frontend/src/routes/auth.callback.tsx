import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

export const Route = createFileRoute('/auth/callback')({
  beforeLoad: ({ location }) => {
    if ('error' in location.search && 'error_code' in location.search) {
      throw redirect({
        to: '/login',
        search: { error: location.search.error as string },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { auth } = Route.useRouteContext();
  useEffect(() => {
    // deno-lint-ignore no-window
    auth.callback(window.location.href)
      .then(() => navigate({ to: '/home' }))
      .catch(
        (err) => {
          console.error('Error during sign-in callback', err);
          navigate({
            to: '/login',
            search: { error: 'Authentication failed.' },
          });
        },
      );
  }, []);
  return <React.Fragment />;
}
