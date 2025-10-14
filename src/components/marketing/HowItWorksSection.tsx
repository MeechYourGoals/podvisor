import { Link2, Sparkles, Target } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    title: "Paste Any YouTube URL",
    description: "Works with interviews, tutorials, podcasts, lectures - any video content"
  },
  {
    icon: Sparkles,
    title: "AI Analyzes & Extracts",
    description: "Our AI identifies key insights, action items, and expert advice tailored to your context"
  },
  {
    icon: Target,
    title: "Get Personalized Insights",
    description: "Receive 10 universal insights + 10 personalized recommendations based on your goals"
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-display font-bold">How It Works</h2>
          <p className="text-muted-foreground">
            Turn hours of video content into actionable insights in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
