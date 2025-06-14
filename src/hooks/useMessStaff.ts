
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, MessDeliveryPersonnel } from '@/types';
import React from 'react';
import { useOwnerMesses } from './useOwnerMesses';

export type MessStaffWithDetails = MessDeliveryPersonnel & {
    profiles: Profile | null;
    messes: { name: string } | null;
};

const fetchMessStaff = async (messIds: string[]): Promise<MessStaffWithDetails[]> => {
    if (messIds.length === 0) return [];
    const { data, error } = await supabase
        .from('mess_delivery_personnel')
        .select(`
            *,
            profiles(*),
            messes(name)
        `)
        .in('mess_id', messIds);
    if (error) throw new Error(error.message);
    return (data as MessStaffWithDetails[]) || [];
};

export const useMessStaff = () => {
    const { user } = useAuth();
    const { messIds, isLoading: isMessesLoading } = useOwnerMesses();

    const { data: staff, isLoading: isStaffLoading, error, refetch } = useQuery({
        queryKey: ['messStaff', messIds],
        queryFn: () => fetchMessStaff(messIds),
        enabled: !!user && messIds.length > 0 && !isMessesLoading,
    });

    return {
        staff,
        isLoading: isMessesLoading || isStaffLoading,
        error,
        refetch,
        messIds,
    };
};
