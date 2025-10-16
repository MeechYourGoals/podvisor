import { Badge } from '@/components/ui/badge';

const HeroSection = () => {
  return (
    <div className="relative py-12 mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-50 blur-3xl"></div>
      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tight">
          Your AI Advisor from YouTube
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto tracking-wide">
          Extract personalized insights from expert videos in minutes. No signup required to start.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Badge variant="secondary" className="text-sm px-4 py-2 glass-card hover:glow-primary transition-all duration-300">
            3 free analyses
          </Badge>
          <Badge variant="outline" className="text-sm px-4 py-2 glass-card hover:glow-primary transition-all duration-300">
            No credit card
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
