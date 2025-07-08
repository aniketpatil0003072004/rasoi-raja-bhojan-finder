import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeliveryWithDetails, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '@/types';
import { CheckCircle, Circle, Clock, Truck, UtensilsCrossed, Package } from 'lucide-react';

interface DeliveryStatusTrackerProps {
  delivery: DeliveryWithDetails;
}

const DeliveryStatusTracker = ({ delivery }: DeliveryStatusTrackerProps) => {
  const statusSteps = [
    { status: 'pending_assignment', label: 'Order Received', icon: Circle },
    { status: 'assigned', label: 'Assigned', icon: Circle },
    { status: 'food_preparing', label: 'Preparing', icon: UtensilsCrossed },
    { status: 'food_ready', label: 'Ready', icon: Package },
    { status: 'picked_up', label: 'Picked Up', icon: CheckCircle },
    { status: 'out_for_delivery', label: 'On the Way', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.status === delivery.status);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Delivery Status</span>
          <Badge className={DELIVERY_STATUS_COLORS[delivery.status]}>
            {DELIVERY_STATUS_LABELS[delivery.status]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            
            const IconComponent = step.icon;
            
            return (
              <div key={step.status} className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-green-100 text-green-600' 
                    : isCurrent 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-grow">
                  <p className={`text-sm font-medium ${
                    isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-blue-600">Current Status</p>
                  )}
                </div>
                
                {index < statusSteps.length - 1 && (
                  <div className={`w-px h-8 ml-4 ${
                    isCompleted ? 'bg-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {delivery.status === 'failed' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Delivery failed. Please contact support for assistance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryStatusTracker;