import { Tables } from "@/integrations/supabase/types";

export type Mess = Tables<'messes'>;
export type Menu = Tables<'menus'>;
export type Subscription = Tables<'subscriptions'>;
export type Profile = Tables<'profiles'>;
export type Delivery = Tables<'deliveries'>;
export type MessDeliveryPersonnel = Tables<'mess_delivery_personnel'>;
export type DeliveryNotification = Tables<'delivery_notifications'>;

// New type for subscriptions with joined data
export type SubscriptionWithDetails = Subscription & {
  profiles: { 
    full_name?: string | null;
    address?: string | null;
    phone_number?: string | null;
  } | null;
  messes: { 
    name?: string | null;
    address?: string | null;
  } | null;
};

// New type for deliveries with joined data
export type DeliveryWithDetails = Delivery & {
  subscriptions: {
    profiles: {
      full_name?: string | null;
      address?: string | null;
    } | null;
  } | null;
  messes: {
    name?: string | null;
    address?: string | null;
    owner_id?: string | null;
  } | null;
};

// Food tracking status labels
export const DELIVERY_STATUS_LABELS = {
  pending_assignment: 'Pending Assignment',
  assigned: 'Assigned to Delivery Person',
  food_preparing: 'Food Being Prepared',
  food_ready: 'Food Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Delivery Failed'
} as const;

// Status colors for UI
export const DELIVERY_STATUS_COLORS = {
  pending_assignment: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  food_preparing: 'bg-yellow-100 text-yellow-800',
  food_ready: 'bg-orange-100 text-orange-800',
  picked_up: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
} as const;