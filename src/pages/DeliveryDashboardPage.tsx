
import React from 'react';
import AssignedDeliveries from '@/components/AssignedDeliveries';
import PublicDeliveries from '@/components/PublicDeliveries';
import { Separator } from '@/components/ui/separator';
import { usePublicDeliveries } from '@/hooks/usePublicDeliveries';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const DeliveryDashboardPage = () => {
  const { data: publicDeliveries, isLoading, error } = usePublicDeliveries();

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6">My Deliveries</h1>
        <AssignedDeliveries />
      </div>

      <Separator />

      {isLoading ? (
        <div>
          <h2 className="text-3xl font-bold mb-6">Available for Pickup</h2>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading deliveries</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : publicDeliveries && publicDeliveries.length > 0 ? (
        <div>
          <h2 className="text-3xl font-bold mb-6">Available for Pickup</h2>
          <PublicDeliveries deliveries={publicDeliveries} />
        </div>
      ) : null}
    </div>
  );
};

export default DeliveryDashboardPage;
