import React from 'react';
import SubscriptionManagement from '@/components/SubscriptionManagement';

const OwnerDashboardPage = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
      <div className="grid gap-6">
        <SubscriptionManagement />
        {/* Other dashboard components can be added here in the future */}
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
