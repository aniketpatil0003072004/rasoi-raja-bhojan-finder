
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionWithDetails, Subscription } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerMesses } from './useOwnerMesses';
import React from 'react';

const fetchSubscriptionsByStatus = async (messIds: string[], status: Subscription['status']): Promise<SubscriptionWithDetails[]> => {
    if (messIds.length === 0) return [];
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*, profiles(full_name, address, phone_number), messes(name, address)')
        .in('mess_id', messIds)
        .eq('status', status);
    if (error) throw new Error(error.message);
    return (data as SubscriptionWithDetails[]) || [];
};

export const useOwnerSubscriptions = (status: Subscription['status']) => {
    const { user } = useAuth();
    const { messIds, isLoading: isMessesLoading, error: messesError } = useOwnerMesses();

    const { data: subscriptions, isLoading: isSubsLoading, error: subsError } = useQuery({
        queryKey: ['ownerSubscriptions', status, messIds],
        queryFn: () => fetchSubscriptionsByStatus(messIds, status),
        enabled: !!user && messIds.length > 0 && !isMessesLoading,
    });

    return {
        subscriptions,
        isLoading: isMessesLoading || isSubsLoading,
        error: messesError || subsError,
    };
};
