
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { DeliveryWithDetails } from '@/types';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DeliveryTaskCardProps {
  delivery: DeliveryWithDetails;
}

const DeliveryTaskCard = ({ delivery }: DeliveryTaskCardProps) => {
  const pickupLocation = delivery.messes?.name || 'Mess';
  const pickupAddress = delivery.messes?.address || 'Pickup address not available';
  const deliveryAddress = delivery.subscriptions?.profiles?.address || 'Delivery address not available';
  const studentName = delivery.subscriptions?.profiles?.full_name || 'Student';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery for {studentName}</CardTitle>
        <CardDescription>Status: <span className="font-semibold capitalize">{delivery.status.replace(/_/g, ' ')}</span></CardDescription>
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
      <CardFooter>
        <Button asChild className="ml-auto">
          <Link to={`/delivery/${delivery.id}`}>
            View Details & Upload Proof
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeliveryTaskCard;
