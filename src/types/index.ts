
import { Tables } from "@/integrations/supabase/types";

export type Mess = Tables<'messes'>;
export type Menu = Tables<'menus'>;
export type Subscription = Tables<'subscriptions'>;
export type Profile = Tables<'profiles'>;

// New type for subscriptions with joined data
export type SubscriptionWithDetails = Subscription & {
  profiles: { 
    full_name?: string | null;
    address?: string | null;
    phone_number?: string | null;
  } | null;
  messes: { name?: string | null } | null;
};
