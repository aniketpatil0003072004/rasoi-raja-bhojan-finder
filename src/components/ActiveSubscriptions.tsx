
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Mess, SubscriptionWithDetails } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info } from 'lucide-react';

const ActiveSubscriptions = () => {
    const { user } = useAuth();

    const fetchOwnerMesses = async (ownerId: string): Promise<Mess[]> => {
        const { data, error } = await supabase.from('messes').select('id').eq('owner_id', ownerId);
        if (error) throw new Error(error.message);
        return data || [];
    };

    const { data: messes, isLoading: isMessesLoading } = useQuery({
        queryKey: ['ownerMesses', user?.id],
        queryFn: () => fetchOwnerMesses(user!.id),
        enabled: !!user,
    });

    const messIds = React.useMemo(() => messes?.map((m) => m.id) || [], [messes]);

    const fetchActiveSubscriptions = async (messIds: string[]): Promise<SubscriptionWithDetails[]> => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*, profiles(full_name, address, phone_number), messes(name)')
            .in('mess_id', messIds)
            .eq('status', 'active');
        if (error) throw new Error(error.message);
        return (data as SubscriptionWithDetails[]) || [];
    };

    const { data: subscriptions, isLoading: isSubsLoading } = useQuery({
        queryKey: ['activeSubscriptions', messIds],
        queryFn: () => fetchActiveSubscriptions(messIds),
        enabled: messIds.length > 0,
    });
    
    const isLoading = isMessesLoading || isSubsLoading;

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
