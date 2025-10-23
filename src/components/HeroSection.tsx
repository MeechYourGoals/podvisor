import { Badge } from '@/components/ui/badge';

const HeroSection = () => {
  return (
    <div className="relative py-12 mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-50 blur-3xl"></div>
      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl md:text-8xl font-display font-bold tracking-tight text-red-600 dark:text-red-500">
            Podvisor
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground/80">
            Your AI-Powered Content Analysis Platform
          </p>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Extract personalized insights from YouTube videos and audio files in minutes. No signup required to start.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Badge variant="secondary" className="text-sm px-4 py-2 glass-card hover:glow-primary transition-all duration-300">
            3 free YouTube analyses
          </Badge>
          <Badge variant="outline" className="text-sm px-4 py-2 glass-card hover:glow-primary transition-all duration-300">
            1 free audio upload
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
