import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, Crown, Zap, Users, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    headline: 'Perfect for trying out Podvisor',
    icon: Zap,
    features: [
      '10 video analyses per month',
      '3 context profiles',
      'Basic bookmarks',
      '30-day video history',
      'Community support'
    ],
    cta: 'Get Started Free',
    variant: 'outline' as const,
    popular: false
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    headline: 'For serious learners and professionals',
    icon: Crown,
    features: [
      'Unlimited video analyses',
      'Unlimited context profiles',
      'Advanced bookmarks & folders',
      'Unlimited history',
      'Refresh insights anytime',
      'Priority AI processing',
      'Export to JSON, CSV, Markdown',
      'Priority email support'
    ],
    cta: 'Upgrade to Pro',
    variant: 'default' as const,
    popular: true
  },
  {
    tier: 'team',
    name: 'Team',
    price: '$29.99',
    period: '/month',
    headline: 'For teams and organizations',
    icon: Users,
    features: [
      'Everything in Pro',
      'Team collaboration tools',
      'Shared video libraries',
      'Admin controls',
      'PDF export',
      '24/7 priority support',
      'Custom integrations (coming soon)'
    ],
    cta: 'Start Team Trial',
    variant: 'outline' as const,
    popular: false
  }
];

export const PricingCards = () => {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async (tier: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (tier === 'free') {
      // Scroll to analysis form
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setLoadingTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { tier },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Start Learning Smarter Today
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loadingTier === plan.tier;
            
            return (
              <Card
                key={plan.tier}
                className={`relative flex flex-col transition-all duration-300 ${
                  plan.popular 
                    ? 'border-2 border-primary shadow-xl scale-105 md:scale-110' 
                    : 'border-2 border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm px-4 py-1 rounded-full font-semibold whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm mt-2">
                      {plan.headline}
                    </CardDescription>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.variant}
                    size="lg"
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {plan.tier !== 'free' && <ExternalLink className="mr-2 h-4 w-4" />}
                        {plan.cta}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};