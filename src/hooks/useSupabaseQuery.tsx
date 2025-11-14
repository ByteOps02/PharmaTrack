import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

type QueryFunction<T> = () => Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>>;

export const useSupabaseQuery = <T,>(
  queryFn: QueryFunction<T>,
  dependencies: React.DependencyList = []
): UseSupabaseQueryResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: queryError } = await queryFn();
      if (queryError) {
        throw queryError;
      }
      setData(result as T); // Assuming result is T or T[]
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
