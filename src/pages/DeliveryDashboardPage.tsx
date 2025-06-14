
import React from 'react';
import AssignedDeliveries from '@/components/AssignedDeliveries';

const DeliveryDashboardPage = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Deliveries</h1>
      <AssignedDeliveries />
    </div>
  );
};

export default DeliveryDashboardPage;
