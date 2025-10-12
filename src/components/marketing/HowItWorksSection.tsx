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
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold">
            From Chaos to Clarity in 3 Steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Turn hours of video content into actionable insights in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Desktop connecting line */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-30" 
               style={{ top: '4rem', left: '15%', right: '15%' }} />
          
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center relative z-10">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold z-20">
                    {index + 1}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};