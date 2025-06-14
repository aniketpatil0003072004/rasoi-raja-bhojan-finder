
import React from 'react';
import { SubscriptionWithDetails } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RejectSubscriptionButton from './RejectSubscriptionButton';

interface PendingSubscriptionsTableProps {
    subscriptions: SubscriptionWithDetails[];
    onViewDetails: (subscription: SubscriptionWithDetails) => void;
    onViewProof: (subscription: SubscriptionWithDetails) => void;
    onApprove: (subscription: SubscriptionWithDetails) => void;
}

const PendingSubscriptionsTable: React.FC<PendingSubscriptionsTableProps> = ({ subscriptions, onViewDetails, onViewProof, onApprove }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Mess</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                        <TableCell>{sub.profiles?.full_name || 'N/A'}</TableCell>
                        <TableCell>{sub.messes?.name || 'N/A'}</TableCell>
                        <TableCell><Badge variant="secondary">{sub.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => onViewDetails(sub)}>View Details</Button>
                            <Button variant="outline" size="sm" onClick={() => onViewProof(sub)} disabled={!sub.payment_screenshot_url}>View Proof</Button>
                            <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => onApprove(sub)}>Approve</Button>
                            <RejectSubscriptionButton subscriptionId={sub.id} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default PendingSubscriptionsTable;
