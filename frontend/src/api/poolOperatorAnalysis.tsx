import { queryOptions } from '@tanstack/react-query';
import { supabase } from './supabase.tsx';

export const poolOperatorAnalysisOptions = queryOptions({
  queryKey: ['poolOperatorAnalysis'],
  // get the most recent pool operator analysis with its closures + source update
  queryFn: async () => {
    const { data, error } = await supabase.from('pool_operator_analysis')
      .select('*,pool_updates(*),pool_closures(*)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error('failed to fetch pool operator analysis', {
        cause: error,
      });
    }
    return data;
  },
  staleTime: 60 * 60 * 1000, // 1 hour
});
