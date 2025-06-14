
import React from 'react';
import AssignedDeliveries from '@/components/AssignedDeliveries';
import PublicDeliveries from '@/components/PublicDeliveries';
import { Separator } from '@/components/ui/separator';

const DeliveryDashboardPage = () => {
  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6">My Deliveries</h1>
        <AssignedDeliveries />
      </div>

      <Separator />

      <div>
        <h2 className="text-3xl font-bold mb-6">Available for Pickup</h2>
        <PublicDeliveries /> 
      </div>
    </div>
  );
};

export default DeliveryDashboardPage;
