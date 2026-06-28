import { Temporal } from '@js-temporal/polyfill';
import {
  Alert,
  Box,
  Code,
  Divider,
  Group,
  List,
  ListItem,
  Loader,
  Stack,
  Text,
} from '@mantine/core';

import { Tables } from '../types/database.types.ts';

type PoolUpdate = Tables<{ schema: 'public' }, 'pool_updates'>;
type PoolClosure = Tables<{ schema: 'public' }, 'pool_closures'>;
type PoolOperatorAnalysis =
  & Tables<
    { schema: 'public' },
    'pool_operator_analysis'
  >
  & { pool_updates: PoolUpdate; pool_closures: PoolClosure[] };

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

interface ClosureDetailProps {
  closure: PoolClosure;
}
const ClosureDetail = ({ closure }: ClosureDetailProps) => {
  const closedAt = closure.closed_at != null
    ? Temporal.Instant.from(closure.closed_at)
    : null;
  const openedAt = closure.opened_at != null
    ? Temporal.Instant.from(closure.opened_at)
    : null;

  return (
    <Stack gap={1}>
      {closedAt != null && (
        <Box>Closed since &ndash; {closedAt.toLocaleString('en-US')}</Box>
      )}
      {openedAt != null && (
        <Box>Expected to reopen &ndash; {openedAt.toLocaleString('en-US')}</Box>
      )}
      {closure.reasoning != null && (
        <Box>Reasoning &ndash; {closure.reasoning}</Box>
      )}
      {closure.confidence_score != null && (
        <Box>Confidence &ndash; {closure.confidence_score}</Box>
      )}
    </Stack>
  );
};

interface AnalysisProps {
  analysis: PoolOperatorAnalysis;
}
const Analysis = ({ analysis }: AnalysisProps) => {
  // Any recorded closure means the pool is (or will be) closed; we don't reason
  // about the specific dates here.
  const closures = analysis.pool_closures ?? [];
  const isClosed = closures.length > 0;

  const created = Temporal.Instant.from(analysis.created_at);
  const updated = analysis?.updated_at != null
    ? Temporal.Instant.from(analysis.updated_at)
    : null;

  const overview = isClosed
    ? 'Pool seems to be closed'
    : 'Pool seems to be open';

  return (
    <Alert variant='outline' title={overview}>
      <Stack gap='xs'>
        {closures.map((closure, index) => (
          <Box key={closure.id}>
            {index > 0 && <Divider my='xs' />}
            <ClosureDetail closure={closure} />
          </Box>
        ))}
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
  analysis: PoolOperatorAnalysis | null;
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
