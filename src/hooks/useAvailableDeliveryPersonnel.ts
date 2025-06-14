
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';

const fetchAvailableDeliveryPersonnel = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'delivery_personnel');

    if (error) throw new Error(error.message);
    return data || [];
};

export const useAvailableDeliveryPersonnel = () => {
    return useQuery({
        queryKey: ['availableDeliveryPersonnel'],
        queryFn: fetchAvailableDeliveryPersonnel,
    });
};
