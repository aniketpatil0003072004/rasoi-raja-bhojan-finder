
import React from 'react';
import { SubscriptionWithDetails } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ViewSubscriberDetailsDialogProps {
    subscription: SubscriptionWithDetails | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const ViewSubscriberDetailsDialog: React.FC<ViewSubscriberDetailsDialogProps> = ({ subscription, isOpen, onOpenChange }) => {
    if (!subscription) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Subscriber Details</DialogTitle>
                    <DialogDescription>
                        Contact information for {subscription.profiles?.full_name || 'the subscriber'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="name" className="text-right w-20 flex-shrink-0">Name</Label>
                        <p id="name" className="flex-grow">{subscription.profiles?.full_name}</p>
                    </div>
                    <div className="flex items-start gap-4">
                        <Label htmlFor="address" className="text-right w-20 flex-shrink-0 pt-1">Address</Label>
                        <p id="address" className="flex-grow">{subscription.profiles?.address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="phone" className="text-right w-20 flex-shrink-0">Phone</Label>
                        <p id="phone" className="flex-grow">{subscription.profiles?.phone_number}</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ViewSubscriberDetailsDialog;
