import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useMealSkips } from '@/hooks/useMealSkips';
import { MEAL_TYPE_LABELS } from '@/types';

interface MealSkipsListProps {
  subscriptionId: string;
}

export const MealSkipsList = ({ subscriptionId }: MealSkipsListProps) => {
  const { mealSkips, isLoading, deleteMealSkip } = useMealSkips(subscriptionId);

  if (isLoading) {
    return <div>Loading skipped meals...</div>;
  }

  if (mealSkips.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No meals skipped yet</p>
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
    <div className="space-y-3">
      {Object.entries(skipsByDate).map(([date, skips]) => (
        <Card key={date}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {skips.map((skip) => (
              <div key={skip.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {MEAL_TYPE_LABELS[skip.meal_type as keyof typeof MEAL_TYPE_LABELS]}
                  </Badge>
                  {skip.reason && (
                    <span className="text-sm text-muted-foreground">{skip.reason}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMealSkip.mutate(skip.id)}
                  disabled={deleteMealSkip.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};