import { queryOptions } from '@tanstack/react-query';
import { supabase } from './supabase.tsx';

export const poolClosureAnalysisOptions = queryOptions({
  queryKey: ['poolClosureAnalysis'],
  // get the most recent pool closure analysis
  queryFn: async () => {
    const { data, error } = await supabase.from('pool_closure_analysis')
      .select('*,pool_closures(*)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error('failed to fetch pool closure analysis', {
        cause: error,
      });
    }
    return data;
  },
  staleTime: 60 * 60 * 1000, // 1 hour
});
