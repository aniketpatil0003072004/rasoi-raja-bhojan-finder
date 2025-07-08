import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DeliveryWithDetails } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package } from 'lucide-react';
import DeliveryStatusTracker from '@/components/DeliveryStatusTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fetchStudentDeliveries = async (userId: string) => {
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      subscriptions!inner (
        user_id,
        profiles!inner (
          full_name,
          address
        )
      ),
      messes (
        name,
        address
      )
    `)
    .eq('subscriptions.user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as DeliveryWithDetails[];
};

const StudentDeliveryTrackingPage = () => {
  const { user } = useAuth();

  const { data: deliveries, isLoading, error } = useQuery({
    queryKey: ['studentDeliveries', user?.id],
    queryFn: () => {
      if (!user) throw new Error("User not authenticated");
      return fetchStudentDeliveries(user.id);
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading deliveries</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Food Deliveries</h1>
        <p className="text-muted-foreground">Track your food orders from preparation to delivery</p>
      </div>

      {deliveries && deliveries.length > 0 ? (
        <div className="space-y-6">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Delivery from {delivery.messes?.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Scheduled for {new Date(delivery.delivery_date).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">From:</p>
                      <p className="text-muted-foreground">{delivery.messes?.name}</p>
                      <p className="text-muted-foreground">{delivery.messes?.address}</p>
                    </div>
                    <div>
                      <p className="font-medium">To:</p>
                      <p className="text-muted-foreground">{delivery.subscriptions?.profiles?.full_name}</p>
                      <p className="text-muted-foreground">{delivery.subscriptions?.profiles?.address}</p>
                    </div>
                    <div>
                      <p className="font-medium">Delivery Person:</p>
                      <p className="text-muted-foreground">
                        {delivery.delivery_person_id ? 'Assigned' : 'Not assigned yet'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <DeliveryStatusTracker delivery={delivery} />
            </div>
          ))}
        </div>
      ) : (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>No Deliveries Found</AlertTitle>
          <AlertDescription>
            You don't have any deliveries yet. Once you subscribe to a mess that offers delivery, 
            your orders will appear here.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default StudentDeliveryTrackingPage;