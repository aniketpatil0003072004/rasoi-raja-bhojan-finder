import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExpiringSubscription {
  id: string;
  user_id: string;
  mess_id: string;
  end_date: string;
  days_until_expiry: number;
  expiration_notified: boolean;
  profiles: {
    full_name: string;
    email: string;
  };
  messes: {
    name: string;
  };
}

export const useSubscriptionExpiration = (daysThreshold: number = 7) => {
  return useQuery({
    queryKey: ['expiring-subscriptions', daysThreshold],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_expiring_subscriptions', { days_before: daysThreshold });

      if (error) throw error;
      return data as ExpiringSubscription[];
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};

export const markSubscriptionNotified = async (subscriptionId: string) => {
  const { error } = await supabase
    .from('subscriptions')
    .update({ expiration_notified: true })
    .eq('id', subscriptionId);

  if (error) throw error;
};