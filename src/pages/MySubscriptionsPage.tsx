import MySubscriptions from "@/components/MySubscriptions";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertCircle, Info } from "lucide-react";

const MySubscriptionsPage = () => {
  const [todayBreakfast, setTodayBreakfast] = useState("");
  const [todayLunch, setTodayLunch] = useState("");
  const [todayDinner, setTodayDinner] = useState("");
  const [messClosureInfo, setMessClosureInfo] = useState<{
    isClosed: boolean;
    closedFrom: string | null;
    closedUntil: string | null;
    closureReason: string | null;
  } | null>(null);
  const [cancellationDeadlines, setCancellationDeadlines] = useState<{
    breakfast: string | null;
    lunch: string | null;
    dinner: string | null;
  } | null>(null);

  const userData = sessionStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  // 🚀 FIXED: FETCH SUBSCRIPTIONS WITH CORRECT CANCELLATION DEADLINE FIELDS
  const fetchUserSubscriptions = async (userId: string) => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        messes(
          name,
          cancellation_deadline_time_breakfast,
          cancellation_deadline_time_lunch,
          cancellation_deadline_time_dinner,
          is_closed,
          closed_from,
          closed_until,
          closure_reason
        )
        `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  };

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["mySubscriptions", user?.id],
    queryFn: () => fetchUserSubscriptions(user.id),
    enabled: !!user,
  });

  // 🚀 TODAY'S MEAL FETCH
  useEffect(() => {
    const fetchMealData = async () => {
      if (!subscriptions || subscriptions.length === 0) return;

      const messInfo = subscriptions[0].messes;
      if (messInfo) {
        setMessClosureInfo({
          isClosed: messInfo.is_closed ?? false,
          closedFrom: messInfo.closed_from,
          closedUntil: messInfo.closed_until,
          closureReason: messInfo.closure_reason,
        });

        setCancellationDeadlines({
          breakfast: messInfo.cancellation_deadline_time_breakfast,
          lunch: messInfo.cancellation_deadline_time_lunch,
          dinner: messInfo.cancellation_deadline_time_dinner,
        });
      }

      const { data } = await supabase
        .from("today_meals")
        .select("*")
        .eq("mess_id", subscriptions[0].mess_id)
        .single();

      if (data) {
        setTodayBreakfast(data.breakfast || "");
        setTodayLunch(data.lunch || "");
        setTodayDinner(data.dinner || "");
      }
    };

    fetchMealData();
  }, [subscriptions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Subscriptions</h1>

      {/* ------- Mess Closure Banner ------ */}
      {messClosureInfo?.isClosed && (
        <Alert variant="destructive" className="mb-6 border-red-300 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900 font-bold text-lg">
            Mess is Currently Closed
          </AlertTitle>
          <AlertDescription className="text-red-800 mt-2">
            <div className="space-y-1">
              {messClosureInfo.closedFrom && messClosureInfo.closedUntil && (
                <>
                  <p>
                    <strong>From:</strong>{" "}
                    {formatDate(messClosureInfo.closedFrom)}
                  </p>
                  <p>
                    <strong>Until:</strong>{" "}
                    {formatDate(messClosureInfo.closedUntil)}
                  </p>
                </>
              )}

              {messClosureInfo.closureReason && (
                <p className="mt-2">
                  <strong>Reason:</strong> {messClosureInfo.closureReason}
                </p>
              )}

              <p className="mt-3 text-sm">
                No meals will be served during this period. Your subscription
                remains active and will resume when the mess reopens.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ------- Cancellation Deadlines Info ------ */}
      {cancellationDeadlines && !messClosureInfo?.isClosed && (
        <Alert className="mb-6 border-blue-300 bg-blue-50">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 font-bold">
            Meal Cancellation Deadlines
          </AlertTitle>
          <AlertDescription className="text-blue-800 mt-2">
            <div className="space-y-1 text-sm">
              {cancellationDeadlines.breakfast && (
                <p>
                  <strong>Breakfast:</strong> Cancel before{" "}
                  {cancellationDeadlines.breakfast}
                </p>
              )}
              {cancellationDeadlines.lunch && (
                <p>
                  <strong>Lunch:</strong> Cancel before{" "}
                  {cancellationDeadlines.lunch}
                </p>
              )}
              {cancellationDeadlines.dinner && (
                <p>
                  <strong>Dinner:</strong> Cancel before{" "}
                  {cancellationDeadlines.dinner}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ------- Today's Meal Section ------ */}
      <div
        className={`mb-6 p-4 rounded-lg ${
          messClosureInfo?.isClosed ? "bg-gray-100 opacity-60" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-bold text-xl">Today's Meal</h2>

          {messClosureInfo?.isClosed && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              Not Available
            </span>
          )}
        </div>

        {messClosureInfo?.isClosed ? (
          <div className="flex items-start gap-2 mt-2">
            <Info className="h-4 w-4 text-gray-500 mt-0.5" />
            <p className="text-sm text-gray-600">
              Meal information is not available while the mess is closed.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="font-bold">
                Breakfast:{" "}
                <span className="font-normal text-sm">
                  {todayBreakfast || "Not available"}
                </span>
              </p>
              {cancellationDeadlines?.breakfast && (
                <p className="text-xs text-gray-500 ml-4">
                  Cancel before: {cancellationDeadlines.breakfast}
                </p>
              )}
            </div>
            <div>
              <p className="font-bold">
                Lunch:{" "}
                <span className="font-normal text-sm">
                  {todayLunch || "Not available"}
                </span>
              </p>
              {cancellationDeadlines?.lunch && (
                <p className="text-xs text-gray-500 ml-4">
                  Cancel before: {cancellationDeadlines.lunch}
                </p>
              )}
            </div>
            <div>
              <p className="font-bold">
                Dinner:{" "}
                <span className="font-normal text-sm">
                  {todayDinner || "Not available"}
                </span>
              </p>
              {cancellationDeadlines?.dinner && (
                <p className="text-xs text-gray-500 ml-4">
                  Cancel before: {cancellationDeadlines.dinner}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ------- Subscription List Component ------ */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <MySubscriptions subscriptions={subscriptions} />
      )}
    </div>
  );
};

export default MySubscriptionsPage;
