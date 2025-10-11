import { Sparkles, Brain, Library } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-background py-16 px-4 rounded-3xl mb-12">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDQyYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
      
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Podvisor
          </h1>
        </div>
        
        <p className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
          Your AI Advisor from YouTube
        </p>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Extract personalized insights from any expert video - startup founders, athletes, doctors, educators, and more
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Universal Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Any YouTube video, any topic
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <Brain className="h-8 w-8 text-accent mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Context-Aware AI</h3>
              <p className="text-sm text-muted-foreground">
                Tailored to your goals and challenges
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <Library className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Your Personal Library</h3>
              <p className="text-sm text-muted-foreground">
                Save, organize, and revisit insights
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;