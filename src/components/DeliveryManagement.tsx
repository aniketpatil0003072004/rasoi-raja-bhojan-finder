
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOwnerSubscriptions } from '@/hooks/useOwnerSubscriptions';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Info, Truck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { SubscriptionWithDetails } from '@/types';

const DeliveryManagement = () => {
    const { subscriptions: activeSubscriptions, isLoading, error } = useOwnerSubscriptions('active');

    const handleAssignDelivery = (subscription: SubscriptionWithDetails) => {
        // This will be implemented in the next step to open a dialog.
        console.log("Assigning delivery for subscription:", subscription.id);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    Delivery Management
                </CardTitle>
                <CardDescription>Assign and track deliveries for active subscriptions.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error loading subscriptions</AlertTitle>
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <h3 className="text-lg font-semibold mb-2">Ready for Delivery</h3>
                        {activeSubscriptions && activeSubscriptions.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Mess</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeSubscriptions.map((sub) => (
                                        <TableRow key={sub.id}>
                                            <TableCell>{sub.profiles?.full_name || 'N/A'}</TableCell>
                                            <TableCell>{sub.messes?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleAssignDelivery(sub)}>
                                                    Assign Delivery
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>No Active Subscriptions</AlertTitle>
                                <AlertDescription>There are no active subscriptions ready for delivery assignment.</AlertDescription>
                            </Alert>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default DeliveryManagement;
