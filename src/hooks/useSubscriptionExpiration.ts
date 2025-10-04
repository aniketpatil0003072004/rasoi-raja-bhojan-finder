import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptionExpiration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check for user's expiring subscriptions (for students)
  const { data: expiringSubscription } = useQuery({
    queryKey: ['expiring-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .rpc('get_expiring_subscriptions', { days_before: 7 })
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 1000 * 60 * 60, // Check every hour
  });

  // Check for expiring subscriptions in owner's messes
  const { data: ownerExpiringSubscriptions = [] } = useQuery({
    queryKey: ['owner-expiring-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get owner's messes
      const { data: messes, error: messError } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user.id);

      if (messError) throw messError;
      if (!messes || messes.length === 0) return [];

      const messIds = messes.map(m => m.id);

      // Get expiring subscriptions for these messes
      const { data, error } = await supabase
        .rpc('get_expiring_subscriptions', { days_before: 7 });

      if (error) throw error;

      // Filter for this owner's messes and include profile info
      const filtered = data?.filter((sub: any) => messIds.includes(sub.mess_id)) || [];
      
      // Get profile info for each subscription
      const subscriptionsWithProfiles = await Promise.all(
        filtered.map(async (sub: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', sub.user_id)
            .single();

          return { ...sub, profile };
        })
      );

      return subscriptionsWithProfiles;
    },
    enabled: !!user,
    refetchInterval: 1000 * 60 * 60, // Check every hour
  });

  // Mark subscription as notified
  const markAsNotified = useMutation({
    mutationFn: async ({ subscriptionId, isOwner }: { subscriptionId: string; isOwner: boolean }) => {
      const updateField = isOwner ? 'owner_expiration_notified' : 'expiration_notified';
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ [updateField]: true })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiring-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['owner-expiring-subscriptions'] });
    },
  });

  return {
    expiringSubscription,
    ownerExpiringSubscriptions,
    markAsNotified,
  };
};
