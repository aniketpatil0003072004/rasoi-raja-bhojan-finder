
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryWithDetails } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';
import UploadDeliveryProof from '@/components/UploadDeliveryProof';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DeliveryStatusTracker from '@/components/DeliveryStatusTracker';
import DeliveryStatusUpdater from '@/components/DeliveryStatusUpdater';
import { useAuth } from '@/contexts/AuthContext';

const fetchDeliveryDetails = async (deliveryId: string) => {
    const { data, error } = await supabase
        .from('deliveries')
        .select(`
            *,
            subscriptions (
                profiles (
                    full_name,
                    address
                )
            ),
            messes (
                name,
                address,
                owner_id
            )
        `)
        .eq('id', deliveryId)
        .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Delivery not found.');
    
    return data as DeliveryWithDetails;
};


const DeliveryDetailsPage = () => {
    const { deliveryId } = useParams<{ deliveryId: string }>();
    const { user } = useAuth();

    const { data: delivery, isLoading, error, refetch } = useQuery({
        queryKey: ['deliveryDetails', deliveryId],
        queryFn: () => fetchDeliveryDetails(deliveryId!),
        enabled: !!deliveryId,
    });

    if (isLoading) {
        return (
            <div className="container py-8 space-y-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading delivery details</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    if (!delivery) return null;

    const pickupLocation = delivery.messes?.name || 'Mess';
    const pickupAddress = delivery.messes?.address || 'Pickup address not available';
    const deliveryAddress = delivery.subscriptions?.profiles?.address || 'Delivery address not available';
    const studentName = delivery.subscriptions?.profiles?.full_name || 'Student';

    return (
        <div className="container py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Delivery Details</h1>
                <p className="text-muted-foreground">Track your delivery progress and upload proof photos</p>
            </div>

            {/* Status Tracker - Always visible for students and delivery personnel */}
            <DeliveryStatusTracker delivery={delivery} />

            {/* Status Updater - Only for delivery personnel and mess owners */}
            {(delivery.delivery_person_id === user?.id || 
              delivery.messes?.owner_id === user?.id) && (
                <DeliveryStatusUpdater delivery={delivery} onUpdate={refetch} />
            )}

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ArrowUp /> Pickup Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold text-lg">{pickupLocation}</p>
                            <p className="text-muted-foreground">{pickupAddress}</p>
                        </div>
                        <UploadDeliveryProof
                            deliveryId={delivery.id}
                            photoType="pickup_mess_photo_url"
                            label="Upload Photo of Mess"
                            currentPhotoUrl={delivery.pickup_mess_photo_url}
                            onUploadSuccess={refetch}
                        />
                        <UploadDeliveryProof
                            deliveryId={delivery.id}
                            photoType="pickup_food_photo_url"
                            label="Upload Photo of Food (at Mess)"
                            currentPhotoUrl={delivery.pickup_food_photo_url}
                            onUploadSuccess={refetch}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ArrowDown /> Drop-off Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <p className="font-semibold text-lg">{studentName}</p>
                            <p className="text-muted-foreground">{deliveryAddress}</p>
                        </div>
                        <UploadDeliveryProof
                            deliveryId={delivery.id}
                            photoType="delivery_house_photo_url"
                            label="Upload Photo of House/Building"
                            currentPhotoUrl={delivery.delivery_house_photo_url}
                            onUploadSuccess={refetch}
                        />
                         <UploadDeliveryProof
                            deliveryId={delivery.id}
                            photoType="delivery_food_photo_url"
                            label="Upload Photo of Food (at Door)"
                            currentPhotoUrl={delivery.delivery_food_photo_url}
                            onUploadSuccess={refetch}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DeliveryDetailsPage;
