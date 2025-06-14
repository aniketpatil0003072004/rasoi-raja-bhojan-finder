
import React from 'react';
import SubscriptionManagement from '@/components/SubscriptionManagement';
import ActiveSubscriptions from '@/components/ActiveSubscriptions';
import DeliveryManagement from '@/components/DeliveryManagement';
import StaffManagement from '@/components/StaffManagement';

const OwnerDashboardPage = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
      <div className="grid gap-6">
        <SubscriptionManagement />
        <ActiveSubscriptions />
        <DeliveryManagement />
        <StaffManagement />
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
