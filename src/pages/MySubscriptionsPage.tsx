
import React from 'react';
import MySubscriptions from '@/components/MySubscriptions';
import { SubscriptionExpirationDialog } from '@/components/SubscriptionExpirationDialog';

const MySubscriptionsPage = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Subscriptions</h1>
      <SubscriptionExpirationDialog />
      <MySubscriptions />
    </div>
  );
};

export default MySubscriptionsPage;
