import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptionExpiration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check student's expiring subscription
  const { data: expiringSubscription } = useQuery({
    queryKey: ['expiring-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, messes(name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .lte('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .eq('expiration_notified', false)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60000, // Check every minute
  });

  // Check owner's expiring subscriptions
  const { data: ownerExpiringSubscriptions } = useQuery({
    queryKey: ['owner-expiring-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messes } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user.id);

      if (!messes || messes.length === 0) return [];

      const messIds = messes.map(m => m.id);

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles(full_name, phone_number),
          messes(name)
        `)
        .in('mess_id', messIds)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .lte('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .eq('owner_expiration_notified', false);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Mark student notification as sent
  const markStudentNotified = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({ expiration_notified: true })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiring-subscription'] });
    },
  });

  // Mark owner notification as sent
  const markOwnerNotified = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({ owner_expiration_notified: true })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-expiring-subscriptions'] });
    },
  });

  return {
    expiringSubscription,
    ownerExpiringSubscriptions,
    markStudentNotified,
    markOwnerNotified,
  };
};
