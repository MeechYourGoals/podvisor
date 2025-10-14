import { Badge } from '@/components/ui/badge';

const HeroSection = () => {
  return (
    <div className="py-8 mb-6">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <h1 className="text-5xl font-display font-bold tracking-tight">
          Your AI Advisor from YouTube
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Extract personalized insights from expert videos in minutes. No signup required to start.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            3 free analyses
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            No credit card
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
