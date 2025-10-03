import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useSubscriptionExpiration } from '@/hooks/useSubscriptionExpiration';
import { X } from 'lucide-react';

export const OwnerExpirationNotifications = () => {
  const { ownerExpiringSubscriptions, markOwnerNotified } = useSubscriptionExpiration();

  if (!ownerExpiringSubscriptions || ownerExpiringSubscriptions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Badge variant="destructive">{ownerExpiringSubscriptions.length}</Badge>
          Subscriptions Expiring Soon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ownerExpiringSubscriptions.map((sub: any) => {
            const daysUntilExpiry = Math.ceil(
              (new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={sub.id}
                className="flex items-start justify-between p-3 bg-white border rounded"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sub.profiles?.full_name}</span>
                    <Badge variant="outline">{sub.messes?.name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expires in <span className="font-semibold text-destructive">{daysUntilExpiry} day(s)</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(sub.end_date), 'MMM d, yyyy')}
                  </p>
                  {sub.profiles?.phone_number && (
                    <p className="text-sm text-muted-foreground">
                      Phone: {sub.profiles.phone_number}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => markOwnerNotified.mutate(sub.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
