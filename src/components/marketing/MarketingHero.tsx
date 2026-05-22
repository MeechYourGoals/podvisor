import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileAudio, Brain, ArrowRight } from 'lucide-react';

/**
 * Marketing landing hero — shown only to anonymous users on /.
 * Editorial, generous whitespace, single CTA, no AI-slop mesh gradients.
 */
export const MarketingHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 sm:py-24">
      {/* Single subtle radial spot, not a mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, hsl(var(--primary) / 0.12), transparent 70%)',
        }}
      />

      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-caption font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          AI insights for video & audio
        </div>

        <h1 className="text-[44px] sm:text-[64px] leading-[1.02] font-display font-semibold tracking-tight text-balance">
          Watch less.{' '}
          <span className="text-primary">Learn more.</span>
        </h1>

        <p className="text-[17px] sm:text-[19px] text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
          Drop a YouTube link or upload audio. Get personalized, expert-level insights in minutes — tailored to who you are and what you're trying to do.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto"
          >
            Try it free <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto"
          >
            Sign in
          </Button>
        </div>

        <p className="text-caption text-muted-foreground pt-1">
          No credit card · 3 free YouTube analyses · 1 free audio upload
        </p>
      </div>

      {/* Feature tiles */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {[
          { icon: Sparkles, title: 'YouTube', desc: 'Any video URL' },
          { icon: FileAudio, title: 'Audio', desc: 'Podcasts, meetings, lectures' },
          { icon: Brain, title: 'Personalized', desc: 'Insights tuned to your context' },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="surface p-4 flex items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="text-[14px] font-semibold leading-tight">{title}</p>
              <p className="text-caption text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
