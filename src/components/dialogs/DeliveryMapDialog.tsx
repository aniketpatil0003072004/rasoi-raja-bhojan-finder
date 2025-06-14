
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DeliveryMap from '@/components/DeliveryMap';

interface DeliveryMapDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pickupAddress: string;
  deliveryAddress: string;
  studentName: string;
}

const DeliveryMapDialog = ({ isOpen, onOpenChange, pickupAddress, deliveryAddress, studentName }: DeliveryMapDialogProps) => {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Delivery Route for {studentName}</DialogTitle>
          <DialogDescription>
            Map showing pickup and delivery locations.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <DeliveryMap pickupAddress={pickupAddress} deliveryAddress={deliveryAddress} />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="secondary">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryMapDialog;
