import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useOwnerMesses } from '@/hooks/useOwnerMesses';

export const OwnerCancellationTimer = () => {
  const { messes } = useOwnerMesses();
  const [timeRemainingList, setTimeRemainingList] = useState<Record<string, string>>({});

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const newTimeRemaining: Record<string, string> = {};

      messes?.forEach((mess) => {
        const cancellationDeadlineTime = (mess as any).cancellation_deadline_time || '23:00';
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [hours, minutes] = cancellationDeadlineTime.split(':').map(Number);
        const deadline = new Date(today);
        deadline.setHours(hours, minutes, 0, 0);
        
        const diff = deadline.getTime() - now.getTime();
        
        if (diff <= 0) {
          newTimeRemaining[mess.id] = 'Ended';
        } else {
          const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
          const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
          newTimeRemaining[mess.id] = `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
        }
      });

      setTimeRemainingList(newTimeRemaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [messes]);

  const formatDeadlineTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (!messes || messes.length === 0) return null;

  return (
    <div className="space-y-4">
      {messes.map((mess) => (
        <Card key={mess.id} className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {mess.name} - Cancellation Deadline Timer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Time left for students to cancel tomorrow's meals:</span>
                <span className="text-2xl font-mono font-bold text-primary ml-4 tabular-nums">
                  {timeRemainingList[mess.id] || '00:00:00'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Deadline: Today at {formatDeadlineTime((mess as any).cancellation_deadline_time || '23:00')}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
