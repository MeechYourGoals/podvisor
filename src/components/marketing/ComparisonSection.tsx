import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBorderCard } from '@/components/ui/animated-border-card';
import { Clock, XCircle, CheckCircle } from 'lucide-react';

export const ComparisonSection = () => {
  return (
    <section className="relative py-20 space-y-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 blur-3xl"></div>
      
      <div className="relative text-center space-y-4 max-w-3xl mx-auto">
        <h2 className="text-8xl font-bold font-display">
          Why YAYA vs. Manual AI Workflows?
        </h2>
        <p className="text-4xl text-muted-foreground leading-relaxed">
          ChatGPT and NotebookLM are amazing — but for extracting insights from videos, here's why YAYA is 10x faster and more comprehensive
        </p>
      </div>

      <div className="relative grid md:grid-cols-2 gap-8">
        {/* Manual Way - Left Card */}
        <Card className="glass-card border-2 border-destructive/30 hover:shadow-glass transition-all duration-300 rounded-2xl">
          <CardHeader className="space-y-3 p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-destructive/10">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
              <CardTitle className="text-6xl">The Manual Way</CardTitle>
            </div>
            <CardDescription className="text-2xl">
              Using ChatGPT, Gemini, Perplexity, or NotebookLM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-8 pt-0">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">😓</span>
                <div>
                  <p className="font-semibold text-3xl">Find & Copy Transcript</p>
                  <p className="text-xl text-muted-foreground mt-1">Manually copy YouTube transcript or upload to AI tool</p>
                  <p className="text-lg text-destructive font-medium mt-2">⏱️ 2-5 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <p className="font-semibold text-3xl">Craft Perfect Prompt</p>
                  <p className="text-xl text-muted-foreground mt-1">Write detailed prompt explaining your context and what you need</p>
                  <p className="text-lg text-destructive font-medium mt-2">⏱️ 3-5 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">👁️</span>
                <div>
                  <p className="font-semibold text-3xl">One Perspective Only</p>
                  <p className="text-xl text-muted-foreground mt-1">Get insights from ONE angle - must repeat entire process for different viewpoints</p>
                  <p className="text-lg text-destructive font-medium mt-2">⏱️ Per perspective</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-semibold text-3xl">Iterate & Refine</p>
                  <p className="text-xl text-muted-foreground mt-1">Revise prompts, re-paste content, clarify questions</p>
                  <p className="text-lg text-destructive font-medium mt-2">⏱️ 10-15 mins per iteration</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📂</span>
                <div>
                  <p className="font-semibold text-3xl">No History</p>
                  <p className="text-xl text-muted-foreground mt-1">Lose your analysis unless you manually save/organize it</p>
                </div>
              </div>
            </div>
            <div className="pt-5 border-t border-destructive/20">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-destructive" />
                <p className="text-3xl font-bold text-destructive">Total: 20-40+ minutes per video, per perspective</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Podvisor Way - Right Card */}
        <AnimatedBorderCard>
          <Card className="glass-card border-2 border-primary/50 hover:shadow-glow-lg transition-all duration-300 rounded-2xl h-full">
            <CardHeader className="space-y-3 p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-6xl">The Podvisor Way</CardTitle>
              </div>
              <CardDescription className="text-2xl">
                One URL, Multiple Expert Perspectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-8 pt-0">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <p className="font-semibold text-3xl text-white">Paste URL, Done</p>
                    <p className="text-xl text-white/90 mt-1">One click - no transcript hunting</p>
                    <p className="text-lg text-white font-semibold mt-2 bg-white/10 px-2 py-0.5 rounded-md inline-block">⏱️ 10 seconds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-semibold text-3xl text-white">Context Saved</p>
                    <p className="text-xl text-white/90 mt-1">Your role, goals, and preferences remembered automatically</p>
                    <p className="text-lg text-white font-semibold mt-2 bg-white/10 px-2 py-0.5 rounded-md inline-block">⏱️ Set once, use forever</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <p className="font-semibold text-3xl text-white">20 Perspectives Instantly</p>
                    <p className="text-xl text-white/90 mt-1">10 universal + 10 personalized insights - all at once, no re-prompting</p>
                    <p className="text-lg text-white font-semibold mt-2 bg-white/10 px-2 py-0.5 rounded-md inline-block">⏱️ Simultaneous</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <p className="font-semibold text-3xl text-white">Switch Contexts Easily</p>
                    <p className="text-xl text-white/90 mt-1">Analyze same video as founder, marketer, or athlete - instant refresh</p>
                    <p className="text-lg text-white font-semibold mt-2 bg-white/10 px-2 py-0.5 rounded-md inline-block">⏱️ 5 seconds to refresh</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📁</span>
                  <div>
                    <p className="font-semibold text-3xl text-white">Organized Library</p>
                    <p className="text-xl text-white/90 mt-1">Auto-saved history with bookmarks and folders</p>
                  </div>
                </div>
              </div>
              <div className="pt-5 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⏱️</span>
                  <p className="text-3xl font-bold text-white">Total: 2 minutes per video, unlimited perspectives</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedBorderCard>
      </div>
    </section>
  );
};
