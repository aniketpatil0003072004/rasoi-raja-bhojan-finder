
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DeliveryWithDetails } from '@/types';

const fetchAssignedDeliveries = async (userId: string) => {
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
    .eq('delivery_person_id', userId)
    .neq('status', 'delivered')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as DeliveryWithDetails[];
};

export const useAssignedDeliveries = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assignedDeliveries', user?.id],
    queryFn: () => {
      if (!user) throw new Error("User not authenticated");
      return fetchAssignedDeliveries(user.id);
    },
    enabled: !!user,
  });
};
