import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Mess, SubscriptionWithDetails, Subscription } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

const fetchOwnerMesses = async (ownerId: string): Promise<Mess[]> => {
    const { data, error } = await supabase.from('messes').select('*').eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
    return data || [];
};

const fetchSubscriptionsByStatus = async (messIds: string[], status: Subscription['status']): Promise<SubscriptionWithDetails[]> => {
    if (messIds.length === 0) return [];
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*, profiles(full_name, address, phone_number), messes(name)')
        .in('mess_id', messIds)
        .eq('status', status);
    if (error) throw new Error(error.message);
    return (data as SubscriptionWithDetails[]) || [];
};

export const useOwnerSubscriptions = (status: Subscription['status']) => {
    const { user } = useAuth();

    const { data: messes, isLoading: isMessesLoading, error: messesError } = useQuery({
        queryKey: ['ownerMesses', user?.id],
        queryFn: () => fetchOwnerMesses(user!.id),
        enabled: !!user,
    });

    const messIds = React.useMemo(() => messes?.map((m) => m.id) || [], [messes]);

    const { data: subscriptions, isLoading: isSubsLoading, error: subsError } = useQuery({
        queryKey: ['ownerSubscriptions', status, messIds],
        queryFn: () => fetchSubscriptionsByStatus(messIds, status),
        enabled: !!user && messIds.length > 0,
    });

    return {
        subscriptions,
        isLoading: isMessesLoading || isSubsLoading,
        error: messesError || subsError,
    };
};
