
import React from 'react';
import SubscriptionManagement from '@/components/SubscriptionManagement';
import ActiveSubscriptions from '@/components/ActiveSubscriptions';
import DeliveryManagement from '@/components/DeliveryManagement';
import MessManagement from '@/components/MessManagement';

const OwnerDashboardPage = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
      <div className="grid gap-6">
        <MessManagement />
        <SubscriptionManagement />
        <ActiveSubscriptions />
        <DeliveryManagement />
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
