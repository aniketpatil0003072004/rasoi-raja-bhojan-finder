
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { DeliveryWithDetails } from '@/types';

interface PublicDeliveriesProps {
    deliveries: DeliveryWithDetails[];
}

const PublicDeliveries = ({ deliveries }: PublicDeliveriesProps) => {
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
