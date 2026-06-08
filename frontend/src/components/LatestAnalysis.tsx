import { Temporal } from '@js-temporal/polyfill';
import {
  Alert,
  Box,
  Code,
  Group,
  List,
  ListItem,
  Loader,
  Stack,
  Text,
} from '@mantine/core';

import { Tables } from '../types/database.types.ts';

type PoolUpdate = Tables<{ schema: 'public' }, 'pool_updates'>;
type PoolClosureAnalysis =
  & Tables<
    { schema: 'public' },
    'pool_closure_analysis'
  >
  & { pool_updates: PoolUpdate };

interface PoolClosuresProps {
  loading: boolean;
  error: Error | null;
  closures: PoolUpdate[] | null;
}

export const PoolClosures = (
  { loading, error, closures }: PoolClosuresProps,
) => {
  return (
    <>
      {loading && <Loader />}
      {error && <Alert title='failed to load closures' />}
      {closures && (
        <List>
          {closures.map((item) => (
            <ListItem key={item.id}>{item.message}</ListItem>
          ))}
        </List>
      )}
    </>
  );
};

interface AnalysisProps {
  analysis: PoolClosureAnalysis;
}
const Analysis = ({ analysis }: AnalysisProps) => {
  const today = Temporal.Now.plainDateISO();

  const closureDate = analysis?.closure_date != null
    ? Temporal.PlainDate.from(analysis.closure_date)
    : null;
  const reopeningDate = analysis?.reopening_date != null
    ? Temporal.PlainDate.from(analysis.reopening_date)
    : null;

  const created = Temporal.Instant.from(analysis.created_at);
  const updated = analysis?.updated_at != null
    ? Temporal.Instant.from(analysis.updated_at)
    : null;

  const isOpen = closureDate == null &&
    (reopeningDate == null ||
      Temporal.PlainDate.compare(reopeningDate, today) <= 0);

  const overview = isOpen ? 'Pool seems to be open' : 'Pool seems to be closed';

  return (
    <Alert variant='outline' title={overview}>
      <Stack gap={1}>
        <Box>Reasoning &ndash; {analysis.reasoning}</Box>
        <Box>Confidence &ndash; {analysis.confidence_score}</Box>
        <Box>
          Pool update &ndash; <Code>{analysis.pool_updates.message}</Code>
        </Box>
        <Group mt='md' justify='flex-end'>
          {updated != null && (
            <Text size='xs'>
              Updated at {updated.toLocaleString('en-US')}
            </Text>
          )}
          {created != null && (
            <Text size='xs'>
              Created at {created.toLocaleString('en-US')}
            </Text>
          )}
        </Group>
      </Stack>
    </Alert>
  );
};

interface LatestAnalysisProps {
  loading: boolean;
  error: Error | null;
  analysis: PoolClosureAnalysis | null;
}
export const LatestAnalysis = (
  { loading, error, analysis }: LatestAnalysisProps,
) => {
  return (
    <>
      {loading && <Loader />}
      {error && <Alert title='failed to load analysis' />}
      {analysis != null && <Analysis analysis={analysis} />}
    </>
  );
};
