import { AppShell, Group } from '@mantine/core';
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { UserMenu } from '../components/UserMenu.tsx';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { auth } = Route.useRouteContext();
  return (
    <AppShell
      header={{ height: 60 }}
      padding='md'
    >
      <AppShell.Header>
        <Group grow h='100%' px='md'>
          <Group justify='flex-start'>
            <Link to='/'>Home</Link>
          </Group>
          <Group justify='flex-end'>
            <UserMenu user={auth.session?.user ?? null} />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
