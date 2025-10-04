import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MEAL_TYPE_LABELS, MealSkip } from '@/types';
import { useOwnerMesses } from '@/hooks/useOwnerMesses';

type MealSkipWithDetails = MealSkip & {
  subscriptions: {
    profiles: {
      full_name: string | null;
      address: string | null;
      phone_number: string | null;
    } | null;
  } | null;
};

export const OwnerMealSkipsView = () => {
  const { messIds } = useOwnerMesses();

  const { data: mealSkips = [], isLoading } = useQuery({
    queryKey: ['owner-meal-skips', messIds],
    queryFn: async () => {
      if (messIds.length === 0) return [];

      const { data, error } = await supabase
        .from('meal_skips')
        .select(`
          *,
          subscriptions!inner(
            mess_id,
            profiles(full_name, address, phone_number)
          )
        `)
        .in('subscriptions.mess_id', messIds)
        .gte('skip_date', new Date().toISOString().split('T')[0])
        .order('skip_date', { ascending: true });

      if (error) throw error;
      return data as MealSkipWithDetails[];
    },
    enabled: messIds.length > 0,
  });

  if (isLoading) {
    return <div>Loading meal skips...</div>;
  }

  if (mealSkips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No upcoming meal skips</p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const skipsByDate = mealSkips.reduce((acc, skip) => {
    const date = skip.skip_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(skip);
    return acc;
  }, {} as Record<string, typeof mealSkips>);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Upcoming Meal Skips</h3>
      {Object.entries(skipsByDate).map(([date, skips]) => (
        <Card key={date}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {skips.map((skip) => (
              <div key={skip.id} className="p-3 border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {skip.subscriptions?.profiles?.full_name || 'Unknown Student'}
                    </span>
                    <Badge variant="secondary">
                      {MEAL_TYPE_LABELS[skip.meal_type as keyof typeof MEAL_TYPE_LABELS]}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {skip.subscriptions?.profiles?.address && (
                    <div>
                      <span className="text-muted-foreground">Address: </span>
                      <span>{skip.subscriptions.profiles.address}</span>
                    </div>
                  )}
                  {skip.subscriptions?.profiles?.phone_number && (
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span>{skip.subscriptions.profiles.phone_number}</span>
                    </div>
                  )}
                </div>
                {skip.reason && (
                  <p className="text-sm text-muted-foreground italic">{skip.reason}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};