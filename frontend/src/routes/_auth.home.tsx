import { Alert, Container, Divider, Stack } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import { useQuery } from '@tanstack/react-query';
import { poolClosureAnalysisOptions } from '../api/poolClosureAnalysis.tsx';
import { LatestAnalysis } from '../components/LatestAnalysis.tsx';
import { Welcome } from '../components/Welcome/Welcome.tsx';

export const Route = createFileRoute('/_auth/home')({
  component: RouteComponent,
});

function RouteComponent() {
  const { auth } = Route.useRouteContext();
  const { data, isLoading, error } = useQuery(poolClosureAnalysisOptions);
  return (
    <Container>
      <Stack>
        <Welcome user={auth.session?.user} />
        <Divider />
        <LatestAnalysis
          loading={isLoading}
          error={error}
          analysis={data ?? null}
        />
        {auth.error != null && (
          <Alert color='red' title='Error'>
            Encountered an authentication error.
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
