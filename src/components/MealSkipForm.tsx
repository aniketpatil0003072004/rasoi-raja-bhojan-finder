import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMealSkips } from "@/hooks/useMealSkips";
import { MEAL_TYPE_LABELS } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MealSkipFormProps {
  subscriptionId: string;
  startDate: string;
  endDate: string;
  messId?: string;
}

export const MealSkipForm = ({
  subscriptionId,
  startDate,
  endDate,
  messId,
}: MealSkipFormProps) => {
  const [todaySelectedMeals, setTodaySelectedMeals] = useState<string[]>([]);
  const [todayReason, setTodayReason] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [rangeReason, setRangeReason] = useState("");
  const [cancellationDeadlineTime, setCancellationDeadlineTime] =
    useState<string>("23:00");
  const { createMealSkip } = useMealSkips(subscriptionId);

  const lastCancelTime = cancellationDeadlineTime.split(":")[0];

  const userData = sessionStorage.getItem("user");
  const user = JSON.parse(userData);

  const getISTDate = () => {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
  };

  useEffect(() => {
    if (messId) {
      const fetchCancellationDeadline = async () => {
        const { data } = await supabase
          .from("messes")
          .select("cancellation_deadline_time")
          .eq("id", messId)
          .maybeSingle();

        if (data?.cancellation_deadline_time) {
          setCancellationDeadlineTime(data.cancellation_deadline_time);
        }
      };
      fetchCancellationDeadline();
    }
  }, [messId]);

  const getAvailableTodayMeals = () => {
    const now = getISTDate();
    const currentHour = now.getHours();
    const availableMeals: string[] = [];

    if (currentHour < 9) {
      availableMeals.push("breakfast", "lunch", "dinner");
    } else if (currentHour >= 9 && currentHour < 14) {
      availableMeals.push("lunch", "dinner");
    } else if (currentHour >= 14 && currentHour < Number(lastCancelTime)) {
      availableMeals.push("dinner");
    }

    return availableMeals;
  };

  const availableTodayMeals = getAvailableTodayMeals();

  const handleTodaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (todaySelectedMeals.length === 0) {
      toast.error("Please select at least one meal to cancel");
      return;
    }

    const today = getISTDate();
    const todayStr = format(today, "yyyy-MM-dd");

    for (const mealType of todaySelectedMeals) {
      await createMealSkip.mutateAsync({
        subscription_id: subscriptionId,
        skip_date: todayStr,
        mess_id: messId,
        user_id: user.id,
        meal_type: mealType as "breakfast" | "lunch" | "dinner",
        reason: todayReason || undefined,
      });
    }

    setTodaySelectedMeals([]);
    setTodayReason("");
    toast.success("Today's meals cancelled successfully");
  };

  const handleRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateFrom || !dateTo) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (dateFrom > dateTo) {
      toast.error("Start date must be before or equal to end date");
      return;
    }

    const now = getISTDate();
    const today = getISTDate();
    today.setHours(0, 0, 0, 0);

    const [hours, minutes] = cancellationDeadlineTime.split(":").map(Number);
    const deadline = new Date(today);
    deadline.setHours(hours, minutes, 0, 0);

    const tomorrow = getISTDate();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const startSkipDate = new Date(dateFrom);
    startSkipDate.setHours(0, 0, 0, 0);

    if (
      startSkipDate.getTime() === tomorrow.getTime() &&
      now.getTime() >= deadline.getTime()
    ) {
      toast.error(
        `Cannot cancel from tomorrow after today's ${cancellationDeadlineTime} deadline`
      );
      return;
    }

    const currentDate = new Date(dateFrom);
    currentDate.setHours(0, 0, 0, 0);
    const endDateObj = new Date(dateTo);
    endDateObj.setHours(0, 0, 0, 0);

    const allMeals = ["breakfast", "lunch", "dinner"];

    while (currentDate <= endDateObj) {
      const dateStr = format(currentDate, "yyyy-MM-dd");

      for (const mealType of allMeals) {
        await createMealSkip.mutateAsync({
          subscription_id: subscriptionId,
          skip_date: dateStr,
          mess_id: messId,
          user_id: user.id,
          meal_type: mealType as "breakfast" | "lunch" | "dinner",
          reason: rangeReason || undefined,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setDateFrom(undefined);
    setDateTo(undefined);
    setRangeReason("");
    toast.success("Meals cancelled for selected date range");
  };

  const toggleTodayMeal = (meal: string) => {
    setTodaySelectedMeals((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
    );
  };

  const getTodayTimeInfo = () => {
    const now = getISTDate();
    const currentHour = now.getHours();

    if (currentHour < 9) {
      return "You can cancel breakfast, lunch, and dinner";
    } else if (currentHour >= 9 && currentHour < 14) {
      return "You can cancel lunch and dinner (breakfast time has passed)";
    } else if (currentHour >= 14 && currentHour < 20) {
      return "You can cancel only dinner (breakfast and lunch time has passed)";
    } else {
      return "All meal times for today have passed";
    }
  };

  return (
    <Tabs defaultValue="today" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="today">Cancel Today</TabsTrigger>
        <TabsTrigger value="range">Cancel Date Range</TabsTrigger>
      </TabsList>

      <TabsContent
        value="today"
        className="space-y-4 p-4 border rounded-lg mt-4"
      >
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">{getTodayTimeInfo()}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Meals to Cancel Today</Label>
            {availableTodayMeals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No meals available for cancellation at this time
              </p>
            ) : (
              <div className="space-y-2">
                {availableTodayMeals.map((mealType) => (
                  <div key={mealType} className="flex items-center space-x-2">
                    <Checkbox
                      id={`today-${mealType}`}
                      checked={todaySelectedMeals.includes(mealType)}
                      onCheckedChange={() => toggleTodayMeal(mealType)}
                    />
                    <label
                      htmlFor={`today-${mealType}`}
                      className="text-sm cursor-pointer"
                    >
                      {
                        MEAL_TYPE_LABELS[
                          mealType as keyof typeof MEAL_TYPE_LABELS
                        ]
                      }
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="today-reason">Reason (Optional)</Label>
            <Textarea
              id="today-reason"
              value={todayReason}
              onChange={(e) => setTodayReason(e.target.value)}
              placeholder="Why are you cancelling?"
              rows={2}
            />
          </div>

          <Button
            onClick={handleTodaySubmit}
            disabled={
              todaySelectedMeals.length === 0 ||
              createMealSkip.isPending ||
              availableTodayMeals.length === 0
            }
            className="w-full"
          >
            {createMealSkip.isPending
              ? "Cancelling..."
              : "Cancel Today's Meals"}
          </Button>
        </div>
      </TabsContent>

      <TabsContent
        value="range"
        className="space-y-4 p-4 border rounded-lg mt-4"
      >
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            This will cancel all 3 meals (breakfast, lunch, dinner) for each day
            in the selected range. Tomorrow's meals must be cancelled before
            today's {cancellationDeadlineTime} deadline.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? (
                      format(dateFrom, "PPP")
                    ) : (
                      <span>Start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    disabled={(d) => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const todayIST = getISTDate();
                      todayIST.setHours(0, 0, 0, 0);
                      const tomorrowStr = format(
                        new Date(todayIST.getTime() + 86400000),
                        "yyyy-MM-dd"
                      );
                      return (
                        dateStr < tomorrowStr ||
                        dateStr < startDate ||
                        dateStr > endDate
                      );
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    disabled={(d) => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const todayIST = getISTDate();
                      todayIST.setHours(0, 0, 0, 0);
                      const tomorrowStr = format(
                        new Date(todayIST.getTime() + 86400000),
                        "yyyy-MM-dd"
                      );
                      const fromStr = dateFrom
                        ? format(dateFrom, "yyyy-MM-dd")
                        : tomorrowStr;
                      return (
                        dateStr < fromStr ||
                        dateStr < startDate ||
                        dateStr > endDate
                      );
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="range-reason">Reason (Optional)</Label>
            <Textarea
              id="range-reason"
              value={rangeReason}
              onChange={(e) => setRangeReason(e.target.value)}
              placeholder="Why are you cancelling these meals?"
              rows={2}
            />
          </div>

          <Button
            onClick={handleRangeSubmit}
            disabled={!dateFrom || !dateTo || createMealSkip.isPending}
            className="w-full"
          >
            {createMealSkip.isPending
              ? "Cancelling..."
              : "Cancel All Meals in Range"}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};
