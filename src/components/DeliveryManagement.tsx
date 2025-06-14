
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOwnerSubscriptions } from '@/hooks/useOwnerSubscriptions';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, CheckCircle, Info, Truck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { SubscriptionWithDetails } from '@/types';
import { useTodaysDeliveries } from '@/hooks/useTodaysDeliveries';
import AssignDeliveryDialog from './dialogs/AssignDeliveryDialog';
import { Badge } from './ui/badge';

const DeliveryManagement = () => {
    const { subscriptions: activeSubscriptions, isLoading: isLoadingSubs, error: subsError } = useOwnerSubscriptions('active');
    const { data: todaysDeliveries, isLoading: isLoadingDeliveries, error: deliveriesError } = useTodaysDeliveries();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithDetails | null>(null);

    const handleAssignDelivery = (subscription: SubscriptionWithDetails) => {
        setSelectedSubscription(subscription);
        setIsDialogOpen(true);
    };
    
    const isLoading = isLoadingSubs || isLoadingDeliveries;
    const error = subsError || deliveriesError;

    const assignedSubscriptionIds = React.useMemo(() => {
        return new Set(todaysDeliveries?.map(d => d.subscription_id));
    }, [todaysDeliveries]);

    return (
        <>
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
                            <AlertTitle>Error loading data</AlertTitle>
                            <AlertDescription>{error.message}</AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <h3 className="text-lg font-semibold mb-2">Today's Deliveries</h3>
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
                                        {activeSubscriptions.map((sub) => {
                                            const isAssigned = assignedSubscriptionIds.has(sub.id);
                                            return (
                                                <TableRow key={sub.id}>
                                                    <TableCell>{sub.profiles?.full_name || 'N/A'}</TableCell>
                                                    <TableCell>{sub.messes?.name || 'N/A'}</TableCell>
                                                    <TableCell className="text-right">
                                                        {isAssigned ? (
                                                            <Badge variant="secondary" className="flex items-center gap-1.5 w-fit ml-auto">
                                                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                                                Assigned
                                                            </Badge>
                                                        ) : (
                                                            <Button variant="outline" size="sm" onClick={() => handleAssignDelivery(sub)}>
                                                                Assign Delivery
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
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
            <AssignDeliveryDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                subscription={selectedSubscription}
            />
        </>
    );
};

export default DeliveryManagement;
