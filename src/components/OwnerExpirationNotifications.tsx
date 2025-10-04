import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscriptionExpiration } from '@/hooks/useSubscriptionExpiration';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';

export const OwnerExpirationNotifications = () => {
  const { ownerExpiringSubscriptions, markAsNotified } = useSubscriptionExpiration();

  const handleDismiss = (subscriptionId: string) => {
    markAsNotified.mutate({ subscriptionId, isOwner: true });
  };

  if (!ownerExpiringSubscriptions || ownerExpiringSubscriptions.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <AlertCircle className="h-5 w-5" />
          Expiring Subscriptions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ownerExpiringSubscriptions.map((sub: any) => (
          <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{sub.profile?.full_name || 'Unknown Student'}</span>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {sub.days_until_expiry} day{sub.days_until_expiry !== 1 ? 's' : ''} left
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Expires: {format(new Date(sub.end_date), 'PPP')}
              </p>
              {sub.profile?.email && (
                <p className="text-xs text-muted-foreground">{sub.profile.email}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(sub.id)}
            >
              Dismiss
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
