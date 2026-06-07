import { createFileRoute, useRouter } from '@tanstack/react-router';
import React, { useEffect } from 'react';

export const Route = createFileRoute('/logout')({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const { auth } = Route.useRouteContext();
  useEffect(() => {
    auth.logout().then(() => {
      router.invalidate().finally(() => {
        navigate({ to: '/' });
      });
    });
  }, [auth, navigate, router]);
  return <React.Fragment />;
}
