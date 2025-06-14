
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryWithDetails } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const fetchPublicDeliveries = async (): Promise<DeliveryWithDetails[]> => {
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      subscriptions (
        profiles (
          full_name,
          address
        )
      ),
      messes (
        name,
        address
      )
    `)
    .is('delivery_person_id', null)
    .eq('status', 'pending_assignment')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as DeliveryWithDetails[];
};

export const usePublicDeliveries = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['publicDeliveries'],
        queryFn: fetchPublicDeliveries,
        enabled: !!user,
    });
};
