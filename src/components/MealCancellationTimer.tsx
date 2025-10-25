import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MealCancellationTimerProps {
  cancellationDeadlineTime: string; // Time in HH:MM:SS or HH:MM format
}

export const MealCancellationTimer = ({
  cancellationDeadlineTime,
}: MealCancellationTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Parse the deadline time (HH:MM:SS or HH:MM)
      const [hours, minutes] = cancellationDeadlineTime.split(":").map(Number);

      // Calculate deadline: today at the specified time
      const deadline = new Date(today);
      deadline.setHours(hours, minutes, 0, 0);

      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Cancellation period has ended for today's meals");
        return;
      }

      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hoursLeft.toString().padStart(2, "0")}:${minutesLeft
          .toString()
          .padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`
      );
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [cancellationDeadlineTime]);

  // Format deadline time for display (convert to 12-hour format)
  const formatDeadlineTime = () => {
    const [hours, minutes] = cancellationDeadlineTime.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Clock className="h-4 w-4 text-primary" />
      <AlertDescription className="ml-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Time left to cancel today's meals:
            </span>
            <span className="text-2xl font-mono font-bold text-primary ml-4 tabular-nums">
              {timeRemaining}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Deadline: Today at {formatDeadlineTime()}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
