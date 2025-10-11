import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Crown, Zap } from 'lucide-react';

export const SubscriptionSection = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No subscription found</p>
      </div>
    );
  }

  const videosUsagePercent = (subscription.videos_analyzed_this_month / subscription.videos_per_month) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Current Plan</h3>
          <Badge variant={subscription.tier === 'free' ? 'secondary' : 'default'} className="capitalize">
            {subscription.tier === 'free' && <Zap className="h-3 w-3 mr-1" />}
            {subscription.tier === 'pro' && <Crown className="h-3 w-3 mr-1" />}
            {subscription.tier}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Videos this month</span>
            <span className="font-medium">
              {subscription.videos_analyzed_this_month} / {subscription.videos_per_month}
            </span>
          </div>
          <Progress value={videosUsagePercent} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile limit</span>
            <span className="font-medium">{subscription.profile_limit} profiles</span>
          </div>
        </div>
      </div>

      {subscription.tier === 'free' && (
        <div className="p-4 border border-accent/20 bg-accent/5 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-accent mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-sm">Upgrade to Pro</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Unlimited video analyses</li>
                <li>• Unlimited context profiles</li>
                <li>• Priority support</li>
                <li>• Advanced insights</li>
              </ul>
            </div>
          </div>
          <Button className="w-full" variant="default">
            Upgrade Now
          </Button>
        </div>
      )}

      {subscription.tier !== 'free' && (
        <Button variant="outline" className="w-full">
          Manage Subscription
        </Button>
      )}
    </div>
  );
};