import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Crown, Zap, ExternalLink } from 'lucide-react';

export const SubscriptionSection = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async (tier: 'pro' | 'annual') => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { tier },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

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
            <span className="text-muted-foreground">YouTube this month</span>
            <span className="font-medium">
              {subscription.videos_analyzed_this_month} / {subscription.videos_per_month === -1 ? '∞' : subscription.videos_per_month}
            </span>
          </div>
          <Progress value={videosUsagePercent} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Audio uploads this month</span>
            <span className="font-medium">
              {subscription.audio_uploads_this_month || 0} / {subscription.audio_per_month === -1 ? '∞' : subscription.audio_per_month || 2}
            </span>
          </div>
          {subscription.audio_per_month !== -1 && (
            <Progress 
              value={((subscription.audio_uploads_this_month || 0) / (subscription.audio_per_month || 2)) * 100} 
              className="h-2" 
            />
          )}
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
                <li>• Unlimited YouTube analyses</li>
                <li>• Unlimited audio file uploads</li>
                <li>• Up to 10 context profiles</li>
                <li>• Unlimited folders per profile</li>
                <li>• Priority support</li>
                <li>• Advanced insights</li>
              </ul>
            </div>
          </div>
          <Button
            className="w-full"
            variant="default"
            onClick={() => handleUpgrade('pro')}
            disabled={isUpgrading}
          >
            {isUpgrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Upgrade Now
              </>
            )}
          </Button>
        </div>
      )}

      {subscription.tier !== 'free' && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleManageSubscription}
          disabled={isManaging}
        >
          {isManaging ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Subscription
            </>
          )}
        </Button>
      )}
    </div>
  );
};