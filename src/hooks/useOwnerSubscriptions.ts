
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Mess, SubscriptionWithDetails } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

const fetchOwnerMesses = async (ownerId: string): Promise<Mess[]> => {
    const { data, error } = await supabase.from('messes').select('*').eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
    return data || [];
};

const fetchPendingSubscriptions = async (messIds: string[]): Promise<SubscriptionWithDetails[]> => {
    if (messIds.length === 0) return [];
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*, profiles(full_name, address, phone_number), messes(name)')
        .in('mess_id', messIds)
        .eq('status', 'pending_owner_confirmation');
    if (error) throw new Error(error.message);
    return (data as SubscriptionWithDetails[]) || [];
};

export const useOwnerSubscriptions = () => {
    const { user } = useAuth();

    const { data: messes, isLoading: isMessesLoading } = useQuery({
        queryKey: ['ownerMesses', user?.id],
        queryFn: () => fetchOwnerMesses(user!.id),
        enabled: !!user,
    });

    const messIds = React.useMemo(() => messes?.map((m) => m.id) || [], [messes]);

    const { data: subscriptions, isLoading: isSubsLoading, error } = useQuery({
        queryKey: ['pendingSubscriptions', messIds],
        queryFn: () => fetchPendingSubscriptions(messIds),
        enabled: !!user && messIds.length > 0,
    });

    return {
        pendingSubscriptions: subscriptions,
        isLoading: isMessesLoading || isSubsLoading,
        error,
    };
};
