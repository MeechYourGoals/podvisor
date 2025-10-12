import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export const FinalCTASection = () => {
  const handleScrollToForm = () => {
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToPricing = () => {
    document.querySelector('[data-pricing-section]')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div 
        className="relative overflow-hidden rounded-2xl p-12 text-center space-y-6"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))',
          border: '2px solid hsl(var(--border))'
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Your Personal AI Advisor Awaits
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-bold">
            Start Extracting Insights in Minutes
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of professionals learning smarter with AI. 
            Turn any YouTube video into actionable wisdom.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-base px-8"
              onClick={handleScrollToForm}
            >
              Try Free (No Credit Card)
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-base px-8"
              onClick={handleScrollToPricing}
            >
              See Pricing
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Get started in seconds. No credit card required for free tier.
          </p>
        </div>
      </div>
    </section>
  );
};