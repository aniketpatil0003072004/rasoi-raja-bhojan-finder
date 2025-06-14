
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info, AlertCircle } from 'lucide-react';
import { useOwnerSubscriptions } from '@/hooks/useOwnerSubscriptions';

const ActiveSubscriptions = () => {
    const { subscriptions, isLoading, error } = useOwnerSubscriptions('active');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Subscribers</CardTitle>
                <CardDescription>A list of all your current active subscribers.</CardDescription>
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
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : !subscriptions || subscriptions.length === 0 ? (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>No Active Subscribers</AlertTitle>
                        <AlertDescription>You do not have any active subscribers at this moment.</AlertDescription>
                    </Alert>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Mess</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Subscribed Until</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>{sub.profiles?.full_name || 'N/A'}</TableCell>
                                    <TableCell>{sub.messes?.name || 'N/A'}</TableCell>
                                    <TableCell>{sub.profiles?.phone_number || 'N/A'}</TableCell>
                                    <TableCell>{sub.profiles?.address || 'N/A'}</TableCell>
                                    <TableCell>{new Date(sub.end_date).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default ActiveSubscriptions;
