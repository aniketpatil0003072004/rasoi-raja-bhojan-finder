
import React from 'react';
import { usePublicDeliveries } from '@/hooks/usePublicDeliveries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertCircle, Info } from 'lucide-react';
import { AlertDescription, AlertTitle } from './ui/alert';
import { Loader2 } from 'lucide-react';

const PublicDeliveries = () => {
    const { data: deliveries, isLoading, error } = usePublicDeliveries();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [acceptingId, setAcceptingId] = React.useState<string | null>(null);

    const acceptMutation = useMutation({
        mutationFn: async (deliveryId: string) => {
            if (!user) throw new Error("User not authenticated");
            setAcceptingId(deliveryId);

            const { error, data } = await supabase
                .from('deliveries')
                .update({ 
                    delivery_person_id: user.id,
                    status: 'assigned' 
                })
                .eq('id', deliveryId)
                .is('delivery_person_id', null)
                .select();

            if (error) throw error;
            if (data && data.length === 0) {
              throw new Error("This delivery was already accepted by someone else.");
            }
        },
        onSuccess: () => {
            toast.success("Delivery accepted!");
            queryClient.invalidateQueries({ queryKey: ['publicDeliveries'] });
            queryClient.invalidateQueries({ queryKey: ['assignedDeliveries', user?.id] });
        },
        onError: (err: any) => {
            toast.error("Failed to accept delivery", { description: err.message });
        },
        onSettled: () => {
            setAcceptingId(null);
        }
    });
    
    if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    if (!deliveries || deliveries.length === 0) {
        return (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Public Deliveries</AlertTitle>
                <AlertDescription>There are currently no deliveries available for pickup in the public pool.</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deliveries.map((delivery) => (
                <Card key={delivery.id}>
                    <CardHeader>
                        <CardTitle>Delivery to {delivery.subscriptions?.profiles?.full_name || 'N/A'}</CardTitle>
                        <CardDescription>From: {delivery.messes?.name || 'N/A'}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p><strong>Pickup Address:</strong> {delivery.messes?.address}</p>
                        <p><strong>Delivery Address:</strong> {delivery.subscriptions?.profiles?.address}</p>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full"
                            onClick={() => acceptMutation.mutate(delivery.id)}
                            disabled={acceptMutation.isPending}
                        >
                            {acceptMutation.isPending && acceptingId === delivery.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Accept Delivery
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};

export default PublicDeliveries;
