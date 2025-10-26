import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AnimatedBorderCard } from '@/components/ui/animated-border-card';
import { Check, Crown, Zap, Loader2, ExternalLink } from 'lucide-react';
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
    headline: 'Perfect for casual learners',
    icon: Zap,
    features: [
      '3 instant YouTube trials (no signup)',
      '1 free audio upload trial',
      '4 YouTube analyses/month after signup',
      '2 audio uploads/month',
      '2 context profiles',
      '2 folders per profile',
      'Global folders view',
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
      'Unlimited YouTube analyses',
      'Unlimited audio file uploads',
      'Up to 10 context profiles',
      'Unlimited folders per profile',
      'Global + profile-specific folders',
      'Unlimited history',
      'Refresh insights anytime',
      'Priority AI processing',
      'Export to JSON, CSV, Markdown',
      'Priority email support'
    ],
    cta: 'Upgrade to Pro',
    variant: 'default' as const,
    popular: false
  },
  {
    tier: 'annual',
    name: 'Annual Pro',
    price: '$99.99',
    period: '/year',
    headline: 'Save 17% with annual billing',
    icon: Crown,
    features: [
      'All Pro features included',
      'Unlimited video analyses',
      'Up to 10 context profiles',
      'Advanced bookmarks & folders',
      'Unlimited history',
      'Export to JSON, CSV, Markdown',
      'Save $20 per year vs monthly',
      'Priority email support'
    ],
    cta: 'Get Annual Pro',
    variant: 'default' as const,
    popular: true
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
    <section className="relative py-20 sm:py-28 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 blur-3xl"></div>
      
      <div className="relative space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-7xl sm:text-8xl font-bold font-display">
            Start Learning Smarter Today
          </h2>
          <p className="text-4xl text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loadingTier === plan.tier;
            
            const CardWrapper = plan.popular ? AnimatedBorderCard : 'div';
            
            return (
              <CardWrapper key={plan.tier}>
                <Card
                  className={`glass-card relative flex flex-col transition-all duration-300 rounded-2xl h-full ${
                    plan.popular 
                      ? 'border-2 border-primary/50 hover:shadow-glow-lg scale-105 md:scale-110' 
                      : 'border-2 border-border/50 hover:border-primary/50 hover:scale-105'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xl px-5 py-1.5 rounded-full font-semibold whitespace-nowrap shadow-glow">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className="text-center space-y-4 p-8">
                    <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-primary/20 to-accent/20' 
                        : 'bg-primary/10'
                    }`}>
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-5xl">{plan.name}</CardTitle>
                      <CardDescription className="text-xl mt-2">
                        {plan.headline}
                      </CardDescription>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-8xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-3xl">{plan.period}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-8 pt-0">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-xl">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-8 pt-0">
                    <Button
                      className="w-full transition-all duration-300 hover:scale-105"
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
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};