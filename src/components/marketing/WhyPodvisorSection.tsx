import { RefreshCw, Users, Clock, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const WhyPodvisorSection = () => {
  return (
    <section className="py-16 sm:py-24 space-y-16">
      {/* Hero Problem Statement */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Why ChatGPT, Gemini & Perplexity Can't Match This
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Generic AI tools give you <span className="text-destructive font-semibold">one perspective</span>. 
          We solve the multi-lens problem they never designed for.
        </p>
      </div>

      {/* Problem Statement Card */}
      <Card className="border-2 border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <span className="text-destructive">⚠️</span>
            The Generic AI Limitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base sm:text-lg leading-relaxed">
            Sure, you can paste a YouTube URL into <span className="font-semibold">ChatGPT</span> or 
            use <span className="font-semibold">Gemini's YouTube button</span>. You'll get insights. 
            But here's the catch:
          </p>
          <p className="text-base sm:text-lg leading-relaxed font-semibold text-foreground">
            You get ONE perspective.
          </p>
          <p className="text-base sm:text-lg leading-relaxed">
            You're a startup founder today analyzing a video? Great. Tomorrow you want to analyze 
            <span className="italic"> the same video</span> as an investor? You'll need to:
          </p>
          <ul className="space-y-2 text-muted-foreground ml-6">
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>Manually switch ChatGPT's memory settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>Rewrite your entire context prompt from scratch</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>Re-paste the transcript (if you even saved it)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>Start over. <span className="font-semibold">Every. Single. Time.</span></span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* 3 Key Differentiators */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Multi-Lens Analysis */}
        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">One Video, Infinite Perspectives</CardTitle>
            <CardDescription>Multi-lens analysis without context switching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              Create separate profiles for different roles. Analyze a Gary Vee video as a{' '}
              <span className="font-semibold text-primary">founder</span> to extract growth tactics, 
              then re-analyze as an <span className="font-semibold text-accent">investor</span> to 
              spot red flags, then again as a <span className="font-semibold text-primary">marketer</span> to 
              understand brand building.
            </p>
            <p className="text-sm font-semibold">
              All without touching ChatGPT's memory or rewriting prompts.
            </p>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Profile 1: "My SaaS Startup" → Customer acquisition</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Profile 2: "My Angel Investing" → Valuation insights</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Profile 3: "My Agency" → Content strategy</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Free users: 3 profiles | Pro users: Unlimited profiles
            </p>
          </CardContent>
        </Card>

        {/* Instant Refresh */}
        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <RefreshCw className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-xl">Instant Refresh = Time Machine</CardTitle>
            <CardDescription>Reanalyze past videos through new lenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              Analyzed a video 3 months ago as a beginner runner? Now you're training for a marathon. 
              Hit <span className="font-semibold text-accent">"Refresh"</span> with your new profile 
              and get <span className="font-semibold">completely different insights</span> tailored 
              to your current level.
            </p>
            <p className="text-sm font-semibold">
              Without re-watching the 2-hour video or copy-pasting transcripts into ChatGPT.
            </p>
            <div className="space-y-2 pt-4 border-t">
              <div className="text-sm">
                <span className="font-semibold">January:</span>
                <p className="text-muted-foreground ml-4">
                  "How to Raise Seed Funding" → Pre-seed founder insights
                </p>
              </div>
              <div className="text-sm">
                <span className="font-semibold">June:</span>
                <p className="text-muted-foreground ml-4">
                  Same video → Series A insights on growth metrics
                </p>
              </div>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg mt-4">
              <p className="text-xs font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                30 seconds vs. 10 minutes of manual ChatGPT prompting
              </p>
            </div>
          </CardContent>
        </Card>

        {/* No Prompt Engineering */}
        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Zero Prompt Gymnastics</CardTitle>
            <CardDescription>Configure once, analyze forever</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              Generic AI tools require you to craft the perfect prompt every time:
            </p>
            <div className="bg-muted/30 p-3 rounded-lg text-xs italic text-muted-foreground border">
              "Analyze this video as a startup founder in the B2B SaaS space with 2 years experience 
              focusing on customer acquisition, give me tactical advice on cold outreach..."
            </div>
            <p className="text-sm font-semibold">
              With Podvisor: Configure your profile ONCE. Every analysis after that is automatically contextualized.
            </p>
            <p className="text-sm text-muted-foreground">
              No copy-pasting. No tweaking prompts. No fighting with ChatGPT's memory.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Side-by-Side Workflow Comparison */}
      <div className="space-y-6">
        <h3 className="text-2xl sm:text-3xl font-bold text-center">
          The Workflow Reality Check
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* ChatGPT/Gemini Workflow */}
          <Card className="border-2 border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <span>ChatGPT / Gemini / Perplexity</span>
                <span className="text-sm font-normal text-destructive">❌ Tedious</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  'Copy YouTube URL',
                  'Open ChatGPT/Gemini',
                  'Find and paste transcript (if available)',
                  'Write 200-word prompt explaining your context',
                  'Wait for response',
                  'Want different angle? Delete chat, start over at step 3',
                  'Want to reanalyze next month? Good luck finding that transcript'
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  ~5 minutes per analysis × context switches = Time sink
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Podvisor Workflow */}
          <Card className="border-2 border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Podvisor</span>
                <span className="text-sm font-normal text-primary">✓ Effortless</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  'Paste YouTube URL',
                  'Select profile (or use default)',
                  'Click "Analyze"',
                  'Get insights in 30 seconds',
                  'Want different angle? Select different profile, click "Refresh"',
                  'Want to reanalyze next month? Click "Refresh" (transcript auto-saved)',
                  'Done. Go build something.'
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-foreground font-medium">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 p-3 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  ~30 seconds per analysis. Every time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Social Proof Quote */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                AC
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-base sm:text-lg italic leading-relaxed">
                "I was manually copying YouTube transcripts into ChatGPT for hours every week. 
                Then I discovered Podvisor's multi-profile system. Now I analyze the same Lex 
                Fridman episode as a <span className="font-semibold text-primary">founder</span>, 
                <span className="font-semibold text-accent"> product manager</span>, AND 
                <span className="font-semibold text-primary"> engineer</span> in under 2 minutes total. 
                Absolute game-changer."
              </p>
              <div className="flex items-center gap-2">
                <p className="font-semibold">Alex Chen</p>
                <span className="text-muted-foreground">•</span>
                <p className="text-sm text-muted-foreground">YC W24 Founder</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <div className="text-center space-y-6 pt-8">
        <h3 className="text-2xl sm:text-3xl font-bold">
          Stop Wrestling With ChatGPT's Memory
        </h3>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start analyzing videos through multiple lenses in seconds, not minutes
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8">
            Try Multi-Profile Analysis Free
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            See Pricing
          </Button>
        </div>
      </div>
    </section>
  );
};
