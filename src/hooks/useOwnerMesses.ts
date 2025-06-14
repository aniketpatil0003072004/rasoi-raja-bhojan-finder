
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Mess } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

const fetchOwnerMesses = async (ownerId: string): Promise<Mess[]> => {
    const { data, error } = await supabase.from('messes').select('*').eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
    return data || [];
};

export const useOwnerMesses = () => {
    const { user } = useAuth();

    const { data: messes, isLoading, error } = useQuery({
        queryKey: ['ownerMesses', user?.id],
        queryFn: () => fetchOwnerMesses(user!.id),
        enabled: !!user,
    });

    const messIds = React.useMemo(() => messes?.map((m) => m.id) || [], [messes]);

    return {
        messes,
        messIds,
        isLoading,
        error,
    };
};
