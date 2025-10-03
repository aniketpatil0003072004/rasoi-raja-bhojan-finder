
import React from 'react';
import MySubscriptions from '@/components/MySubscriptions';

const MySubscriptionsPage = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Subscriptions</h1>
      <MySubscriptions />
    </div>
  );
};

export default MySubscriptionsPage;
