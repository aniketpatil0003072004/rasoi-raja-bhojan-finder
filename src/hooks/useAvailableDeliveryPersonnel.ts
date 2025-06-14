
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';

const fetchAvailableDeliveryPersonnel = async (messId: string): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'delivery_personnel')
        .eq('mess_id', messId);

    if (error) throw new Error(error.message);
    return data || [];
};

export const useAvailableDeliveryPersonnel = (messId: string | undefined | null) => {
    return useQuery({
        queryKey: ['availableDeliveryPersonnel', messId],
        queryFn: () => fetchAvailableDeliveryPersonnel(messId!),
        enabled: !!messId,
    });
};
