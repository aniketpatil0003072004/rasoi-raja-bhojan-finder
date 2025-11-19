import { supabase } from "@/integrations/supabase/client";
import { SubscriptionWithDetails } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useOwnerMesses } from "./useOwnerMesses";

const fetchSubscriptionsByStatus = async (
  messIds: string[]
): Promise<SubscriptionWithDetails[]> => {
  if (messIds.length === 0) return [];
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, user(full_name, address, phone_number), messes(name, address)")
    .in("mess_id", messIds);

  if (error) throw new Error(error.message);
  return (data as SubscriptionWithDetails[]) || [];
};

export const useOwnerSubscriptions = () => {
  const userData = sessionStorage.getItem("user");
  const user = JSON.parse(userData);
  const {
    messIds,
    isLoading: isMessesLoading,
    error: messesError,
  } = useOwnerMesses();

  const {
    data: subscriptions,
    isLoading: isSubsLoading,
    error: subsError,
  } = useQuery({
    queryKey: ["ownerSubscriptions", messIds],
    queryFn: () => fetchSubscriptionsByStatus(messIds),
    enabled: !!user && messIds.length > 0 && !isMessesLoading,
  });

  return {
    subscriptions,
    isLoading: isMessesLoading || isSubsLoading,
    error: messesError || subsError,
  };
};
