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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate deadline: today at (24 - cancellationDeadlineHours) o'clock
      const deadline = new Date(today);
      deadline.setHours(24 - cancellationDeadlineHours, 0, 0, 0);
      
      const diff = deadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Cancellation period has ended for tomorrow\'s meals');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [cancellationDeadlineHours]);

  const deadlineTime = 24 - cancellationDeadlineHours;
  const deadlineDisplay = `${deadlineTime.toString().padStart(2, '0')}:00 ${deadlineTime >= 12 ? 'PM' : 'AM'}`;

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Clock className="h-4 w-4 text-primary" />
      <AlertDescription className="ml-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Time left to cancel tomorrow's meals:</span>
            <span className="text-2xl font-mono font-bold text-primary ml-4 tabular-nums">{timeRemaining}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Deadline: Today at {deadlineDisplay} ({cancellationDeadlineHours} hours before tomorrow's first meal)
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
