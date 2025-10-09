import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MealCancellationTimerProps {
  cancellationDeadlineHours: number;
}

export const MealCancellationTimer = ({ cancellationDeadlineHours }: MealCancellationTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
      
      // Calculate deadline for tomorrow's meals
      const deadline = new Date(tomorrow);
      deadline.setHours(-cancellationDeadlineHours, 0, 0, 0);
      
      const diff = deadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Cancellation period has ended for tomorrow\'s meals');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [cancellationDeadlineHours]);

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Clock className="h-4 w-4 text-primary" />
      <AlertDescription className="ml-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Time left to cancel tomorrow's meals:</span>
          <span className="text-lg font-bold text-primary ml-4">{timeRemaining}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Meals must be cancelled at least {cancellationDeadlineHours} hours before meal time
        </p>
      </AlertDescription>
    </Alert>
  );
};
