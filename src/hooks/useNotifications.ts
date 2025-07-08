import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DeliveryNotification } from '@/types';
import { useToast } from '@/hooks/use-toast';

const fetchNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('delivery_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return data as DeliveryNotification[];
};

const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('delivery_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    throw new Error(error.message);
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    error
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => {
      if (!user) throw new Error("User not authenticated");
      return fetchNotifications(user.id);
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as DeliveryNotification;
          
          // Show toast notification
          toast({
            title: "Delivery Update",
            description: newNotification.message,
            duration: 5000,
          });

          // Update query cache
          queryClient.setQueryData(['notifications', user.id], (old: DeliveryNotification[] | undefined) => {
            if (!old) return [newNotification];
            return [newNotification, ...old];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, queryClient]);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return {
    notifications: notifications || [],
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending
  };
};