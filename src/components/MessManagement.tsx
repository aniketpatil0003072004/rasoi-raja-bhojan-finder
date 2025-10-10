import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnerMesses } from '@/hooks/useOwnerMesses';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AddMenuForm from './AddMenuForm';
import MessPricingForm from './MessPricingForm';
import AssignDeliveryPersonForm from './AssignDeliveryPersonForm';
import { MealCancellationDeadlineSettings } from './MealCancellationDeadlineSettings';

const MessManagement: React.FC = () => {
  const { messes, isLoading, error } = useOwnerMesses();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mess Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mess Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load messes: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!messes || messes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mess Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No messes found. Add a mess first to manage it.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mess Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {messes.map((mess) => (
            <div key={mess.id} className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4">{mess.name}</h3>
              
              <Tabs defaultValue="menu" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="menu">Menu</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="staff">Staff</TabsTrigger>
                  <TabsTrigger value="cancellation">Cancellation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="menu" className="mt-4">
                  <AddMenuForm messId={mess.id} />
                </TabsContent>
                
                <TabsContent value="pricing" className="mt-4">
                  <MessPricingForm mess={mess} />
                </TabsContent>
                
                <TabsContent value="staff" className="mt-4">
                  <AssignDeliveryPersonForm 
                    messId={mess.id} 
                    messName={mess.name}
                  />
                </TabsContent>
                
                <TabsContent value="cancellation" className="mt-4">
                  <MealCancellationDeadlineSettings mess={mess} />
                </TabsContent>
              </Tabs>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MessManagement;