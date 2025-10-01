import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MealSkip } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useMealSkips = (subscriptionId?: string) => {
  const queryClient = useQueryClient();

  const { data: mealSkips = [], isLoading } = useQuery({
    queryKey: ['meal-skips', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];
      
      const { data, error } = await supabase
        .from('meal_skips')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .gte('skip_date', new Date().toISOString().split('T')[0])
        .order('skip_date', { ascending: true });

      if (error) throw error;
      return data as MealSkip[];
    },
    enabled: !!subscriptionId,
  });

  const createMealSkip = useMutation({
    mutationFn: async (skip: { subscription_id: string; skip_date: string; meal_type: 'breakfast' | 'lunch' | 'dinner'; reason?: string }) => {
      const { data, error } = await supabase
        .from('meal_skips')
        .insert([skip])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-skips', subscriptionId] });
      toast({ title: 'Meal skip added successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error adding meal skip', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteMealSkip = useMutation({
    mutationFn: async (skipId: string) => {
      const { error } = await supabase
        .from('meal_skips')
        .delete()
        .eq('id', skipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-skips', subscriptionId] });
      toast({ title: 'Meal skip removed successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error removing meal skip', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    mealSkips,
    isLoading,
    createMealSkip,
    deleteMealSkip,
  };
};