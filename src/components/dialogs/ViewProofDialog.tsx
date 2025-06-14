
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface ViewProofDialogProps {
    proofUrl: string | null;
    studentName: string | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const ViewProofDialog: React.FC<ViewProofDialogProps> = ({ proofUrl, studentName, isOpen, onOpenChange }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Payment Proof from {studentName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    {proofUrl ? (
                        <img src={proofUrl} alt="Payment Proof" className="w-full h-auto rounded-md" />
                    ) : (
                        <Skeleton className="w-full h-[400px] rounded-md" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewProofDialog;
