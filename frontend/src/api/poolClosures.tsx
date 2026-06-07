import { queryOptions } from '@tanstack/react-query';
import { supabase } from './supabase.tsx';

export const poolClosuresQueryOptions = queryOptions({
  queryKey: ['poolClosures'],
  queryFn: async () => {
    const { data, error } = await supabase.from('pool_closures').select('*')
      .order(
        'created_at',
        { ascending: false },
      );
    if (error) throw new Error('failed to get pool closures', { cause: error });
    return data;
  },
  staleTime: 60 * 60 * 1000, // 1 hour
});
