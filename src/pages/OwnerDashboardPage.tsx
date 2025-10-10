import React from 'react';
import SubscriptionManagement from '@/components/SubscriptionManagement';
import ActiveSubscriptions from '@/components/ActiveSubscriptions';
import DeliveryManagement from '@/components/DeliveryManagement';
import MessManagement from '@/components/MessManagement';
import { OwnerMealSkipsView } from '@/components/OwnerMealSkipsView';
import { OwnerCancellationTimer } from '@/components/OwnerCancellationTimer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OwnerDashboardPage = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
      <Tabs defaultValue="mess" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mess">Mess Management</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="meal-skips">Meal Skips</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mess" className="mt-6">
          <MessManagement />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionManagement />
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <ActiveSubscriptions />
        </TabsContent>
        
        <TabsContent value="delivery" className="mt-6">
          <DeliveryManagement />
        </TabsContent>
        
        <TabsContent value="meal-skips" className="mt-6">
          <div className="space-y-6">
            <OwnerCancellationTimer />
            <OwnerMealSkipsView />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboardPage;
