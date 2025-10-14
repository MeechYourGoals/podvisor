import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

export const ComparisonSection = () => {
  const manualPainPoints = [
    { text: "Find & copy YouTube transcript", time: "2-5 mins" },
    { text: "Craft the perfect prompt explaining your context", time: "3-5 mins" },
    { text: "Get ONE perspective - must repeat for different viewpoints", time: "" },
    { text: "Iterate & refine prompts, re-paste content", time: "10-15 mins/iteration" },
    { text: "No organized history - manually save everything", time: "" },
  ];

  const podvisorBenefits = [
    { text: "Paste URL, done - no transcript hunting", time: "10 seconds" },
    { text: "Your context saved automatically in profiles", time: "" },
    { text: "20 perspectives instantly - all at once", time: "" },
    { text: "Switch contexts with one click - instant refresh", time: "2 seconds" },
    { text: "Auto-saved library with bookmarks & folders", time: "" },
  ];

  return (
    <section className="py-16">
      <div className="text-center mb-12 space-y-3">
        <h2 className="text-4xl font-display font-bold tracking-tight">
          Why Podvisor vs. ChatGPT/NotebookLM?
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          ChatGPT and NotebookLM are amazing - but for extracting insights from videos, 
          here's why Podvisor is <span className="font-semibold text-foreground">10x faster and more comprehensive</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Manual Way Card */}
        <Card className="border-2 border-muted bg-muted/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-2xl">The Manual Way</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Using ChatGPT, Gemini, Perplexity, or NotebookLM
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {manualPainPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-muted-foreground mt-1 flex-shrink-0">😓</span>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{point.text}</p>
                    {point.time && (
                      <p className="text-xs text-muted-foreground mt-1">{point.time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold text-muted-foreground">
                ⏱️ Total Time: <span className="text-destructive">20-40+ minutes per video, per perspective</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Podvisor Way Card */}
        <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">The Podvisor Way</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              One URL, Multiple Expert Perspectives
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {podvisorBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="mt-1 flex-shrink-0">✨</span>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed font-medium">{benefit.text}</p>
                    {benefit.time && (
                      <p className="text-xs text-primary mt-1">{benefit.time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-primary/20">
              <p className="text-sm font-semibold">
                ⏱️ Total Time: <span className="text-primary">2 minutes per video, unlimited perspectives</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
