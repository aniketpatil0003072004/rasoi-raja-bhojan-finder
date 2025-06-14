
import React from 'react';
import { useAssignedDeliveries } from '@/hooks/useAssignedDeliveries';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import DeliveryTaskCard from './DeliveryTaskCard';

const AssignedDeliveries = () => {
  const { data: deliveries, isLoading, error } = useAssignedDeliveries();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading deliveries</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      {deliveries && deliveries.length > 0 ? (
        <div className="grid gap-6">
          {deliveries.map((delivery) => (
            <DeliveryTaskCard key={delivery.id} delivery={delivery} />
          ))}
        </div>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Assigned Deliveries</AlertTitle>
          <AlertDescription>You have no deliveries assigned to you at the moment. Check back later!</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AssignedDeliveries;
