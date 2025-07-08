import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryWithDetails, DELIVERY_STATUS_LABELS } from '@/types';
import { Database } from '@/integrations/supabase/types';

type DeliveryStatus = Database['public']['Enums']['delivery_status'];

interface DeliveryStatusUpdaterProps {
  delivery: DeliveryWithDetails;
  onUpdate?: () => void;
}

const updateDeliveryStatus = async ({ deliveryId, status }: { deliveryId: string; status: DeliveryStatus }) => {
  const { error } = await supabase
    .from('deliveries')
    .update({ status })
    .eq('id', deliveryId);

  if (error) {
    throw new Error(error.message);
  }
};

const DeliveryStatusUpdater = ({ delivery, onUpdate }: DeliveryStatusUpdaterProps) => {
  const [selectedStatus, setSelectedStatus] = useState(delivery.status);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateDeliveryStatus,
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Delivery status has been updated successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['assignedDeliveries'] });
      queryClient.invalidateQueries({ queryKey: ['ownerSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['todaysDeliveries'] });
      
      onUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = () => {
    if (selectedStatus !== delivery.status) {
      updateMutation.mutate({
        deliveryId: delivery.id,
        status: selectedStatus,
      });
    }
  };

  // Define valid status transitions based on current status
  const getAvailableStatuses = () => {
    const statusFlow = [
      'pending_assignment',
      'assigned',
      'food_preparing',
      'food_ready',
      'picked_up',
      'out_for_delivery',
      'delivered'
    ];

    const currentIndex = statusFlow.indexOf(delivery.status);
    
    // Allow current status and next statuses, plus 'failed' from any status
    const availableStatuses = statusFlow.slice(currentIndex);
    
    // Always allow 'failed' status
    if (!availableStatuses.includes('failed')) {
      availableStatuses.push('failed');
    }

    return availableStatuses;
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Update Delivery Status</span>
          <Badge variant="outline">
            Current: {DELIVERY_STATUS_LABELS[delivery.status]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select New Status</label>
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as DeliveryStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {DELIVERY_STATUS_LABELS[status as keyof typeof DELIVERY_STATUS_LABELS]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleStatusUpdate}
          disabled={selectedStatus === delivery.status || updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? 'Updating...' : 'Update Status'}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>• Status changes trigger automatic notifications to students and delivery personnel</p>
          <p>• You can only move forward in the delivery process or mark as failed</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryStatusUpdater;