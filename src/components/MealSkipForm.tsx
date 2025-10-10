import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMealSkips } from '@/hooks/useMealSkips';
import { MEAL_TYPE_LABELS } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MealSkipFormProps {
  subscriptionId: string;
  startDate: string;
  endDate: string;
  messId?: string;
}

export const MealSkipForm = ({ subscriptionId, startDate, endDate, messId }: MealSkipFormProps) => {
  const [date, setDate] = useState<Date>();
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [cancellationDeadlineTime, setCancellationDeadlineTime] = useState<string>('23:00');
  const { createMealSkip } = useMealSkips(subscriptionId);

  // Fetch mess cancellation deadline
  useEffect(() => {
    if (messId) {
      const fetchCancellationDeadline = async () => {
        const { data } = await supabase
          .from('messes')
          .select('cancellation_deadline_time')
          .eq('id', messId)
          .maybeSingle();
        
        if (data?.cancellation_deadline_time) {
          setCancellationDeadlineTime(data.cancellation_deadline_time);
        }
      };
      fetchCancellationDeadline();
    }
  }, [messId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || selectedMeals.length === 0) {
      toast.error('Please select a date and at least one meal');
      return;
    }

    // Validate cancellation deadline - must be done before today's deadline time
    const now = new Date();
    const [hours, minutes] = cancellationDeadlineTime.split(':').map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(today);
    deadline.setHours(hours, minutes, 0, 0);
    
    // Can only cancel tomorrow's meals if we're before today's deadline
    const skipDate = new Date(date);
    skipDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (skipDate.getTime() === tomorrow.getTime() && now.getTime() >= deadline.getTime()) {
      toast.error(`Cannot cancel tomorrow's meals after today's ${cancellationDeadlineTime} deadline`);
      return;
    }

    for (const mealType of selectedMeals) {
      await createMealSkip.mutateAsync({
        subscription_id: subscriptionId,
        skip_date: format(date, 'yyyy-MM-dd'),
        meal_type: mealType as 'breakfast' | 'lunch' | 'dinner',
        reason: reason || undefined,
      });
    }

    // Reset form
    setDate(undefined);
    setSelectedMeals([]);
    setReason('');
  };

  const toggleMeal = (meal: string) => {
    setSelectedMeals(prev => 
      prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <Label>Select Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return dateStr < new Date().toISOString().split('T')[0] || 
                       dateStr < startDate || 
                       dateStr > endDate;
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Note: Tomorrow's meals must be cancelled before today's {cancellationDeadlineTime} deadline
        </p>
      </div>

      <div className="space-y-2">
        <Label>Select Meals to Skip</Label>
        <div className="space-y-2">
          {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={value}
                checked={selectedMeals.includes(value)}
                onCheckedChange={() => toggleMeal(value)}
              />
              <label htmlFor={value} className="text-sm cursor-pointer">
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason (Optional)</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you skipping this meal?"
          rows={2}
        />
      </div>

      <Button 
        type="submit" 
        disabled={!date || selectedMeals.length === 0 || createMealSkip.isPending}
        className="w-full"
      >
        {createMealSkip.isPending ? 'Adding...' : 'Skip Meal(s)'}
      </Button>
    </form>
  );
};