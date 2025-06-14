
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOwnerMesses } from './useOwnerMesses';
import { Delivery } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const fetchTodaysDeliveries = async (messIds: string[]): Promise<Delivery[]> => {
  if (messIds.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .in('mess_id', messIds)
    .eq('delivery_date', today);

  if (error) throw new Error(error.message);
  return data || [];
};

export const useTodaysDeliveries = () => {
  const { user } = useAuth();
  const { messIds, isLoading: isMessesLoading } = useOwnerMesses();

  return useQuery({
    queryKey: ['todaysDeliveries', messIds],
    queryFn: () => fetchTodaysDeliveries(messIds),
    enabled: !!user && messIds.length > 0 && !isMessesLoading,
  });
};
