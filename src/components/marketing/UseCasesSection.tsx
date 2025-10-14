import { Target, TrendingUp, Users, Lightbulb, DollarSign, Heart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const useCases = [
  {
    icon: Target,
    title: "Startup Founders",
    description: "Extract tactical lessons from Y Combinator interviews and founder podcasts",
    examples: "Paul Graham essays, startup podcasts, investor advice",
    insight: "10 tactical insights extracted in 2 minutes"
  },
  {
    icon: DollarSign,
    title: "Financial Education",
    description: "Extract investment strategies, market analysis, and wealth-building principles from financial experts",
    examples: "Bloomberg markets, Yahoo Finance, financial literacy courses, investment podcasts",
    insight: "Turn hours of financial content into actionable investment insights"
  },
  {
    icon: Users,
    title: "Business Professionals",
    description: "Learn negotiation tactics, sales strategies, and leadership principles",
    examples: "Leadership talks, sales training, management seminars",
    insight: "Action items tailored to your role and goals"
  },
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Distill science-backed health protocols from longevity experts and medical researchers",
    examples: "Dr. Andrew Huberman podcasts, Gary Brecka protocols, Bryan Johnson routines",
    insight: "Extract personalized health protocols from hour-long expert videos"
  },
  {
    icon: TrendingUp,
    title: "Athletes & Coaches",
    description: "Analyze training methodologies from Olympic coaches and pro athletes",
    examples: "Training videos, sports psychology, performance optimization",
    insight: "Personalized training insights from world-class experts"
  },
  {
    icon: Lightbulb,
    title: "Personal Development",
    description: "Get personalized advice from productivity experts, psychologists, and life coaches",
    examples: "Self-improvement videos, mental health talks, productivity systems",
    insight: "Insights customized to your personal journey"
  }
];

export const UseCasesSection = () => {
  return (
    <section className="py-12 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-display font-bold">
            Who Uses Podvisor
          </h2>
          <p className="text-muted-foreground">
            Learn from the world's best experts - personalized for your goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase) => (
            <Card 
              key={useCase.title}
              className="border rounded-xl p-6 hover:border-primary hover:shadow-md transition-all"
            >
              <CardHeader className="p-0 mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <useCase.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {useCase.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Example videos: </span>
                  <span className="text-foreground">{useCase.examples}</span>
                </div>
                <div className="text-xs font-medium text-primary">
                  🎙️ {useCase.insight}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
