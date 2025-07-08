
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DeliveryWithDetails, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '@/types';
import { ArrowDown, ArrowUp, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import DeliveryMapDialog from './dialogs/DeliveryMapDialog';
import DeliveryStatusTracker from './DeliveryStatusTracker';

interface DeliveryTaskCardProps {
  delivery: DeliveryWithDetails;
}

const DeliveryTaskCard = ({ delivery }: DeliveryTaskCardProps) => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const pickupLocation = delivery.messes?.name || 'Mess';
  const pickupAddress = delivery.messes?.address || 'Pickup address not available';
  const deliveryAddress = delivery.subscriptions?.profiles?.address || 'Delivery address not available';
  const studentName = delivery.subscriptions?.profiles?.full_name || 'Student';

  const canShowMap = pickupAddress !== 'Pickup address not available' && deliveryAddress !== 'Delivery address not available';

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Delivery for {studentName}</CardTitle>
              <Badge className={DELIVERY_STATUS_COLORS[delivery.status]}>
                {DELIVERY_STATUS_LABELS[delivery.status]}
              </Badge>
            </div>
            <CardDescription>
              Delivery scheduled for {new Date(delivery.delivery_date).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-start gap-4">
              <ArrowUp className="h-6 w-6 mt-1 text-primary" />
              <div>
                <p className="font-semibold">Pickup From: {pickupLocation}</p>
                <p className="text-sm text-muted-foreground">{pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ArrowDown className="h-6 w-6 mt-1 text-primary" />
              <div>
                <p className="font-semibold">Deliver To: {studentName}</p>
                <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {canShowMap && (
              <Button variant="outline" onClick={() => setIsMapOpen(true)}>
                <MapPin className="mr-2 h-4 w-4" />
                View on Map
              </Button>
            )}
            <Button asChild className="ml-auto">
              <Link to={`/delivery/${delivery.id}`}>
                View Details & Upload Proof
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <DeliveryStatusTracker delivery={delivery} />
      </div>

      {canShowMap && (
        <DeliveryMapDialog
          isOpen={isMapOpen}
          onOpenChange={setIsMapOpen}
          pickupAddress={pickupAddress}
          deliveryAddress={deliveryAddress}
          studentName={studentName}
        />
      )}
    </>
  );
};

export default DeliveryTaskCard;
