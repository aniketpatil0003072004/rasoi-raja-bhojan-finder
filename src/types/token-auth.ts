export interface UserToken {
  id: string;
  token: string;
  user_id: string | null;
  role: 'student' | 'mess_owner' | 'delivery_personnel';
  full_name: string;
  created_at: string;
  is_used: boolean;
}

export interface ExpiringSubscription {
  id: string;
  user_id: string;
  mess_id: string;
  end_date: string;
  days_until_expiry: number;
  expiration_notified?: boolean;
  owner_expiration_notified?: boolean;
}
