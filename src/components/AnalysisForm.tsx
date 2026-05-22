import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, ChevronDown, Sparkles, Youtube } from 'lucide-react';
import { ProfileQuickSwitcher } from './ProfileQuickSwitcher';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useAuth } from '@/hooks/useAuth';
import { AnonymousVideoStorage } from '@/lib/anonymousVideoStorage';
import { AnonymousLimitModal } from './AnonymousLimitModal';

const videoSchema = z.object({
  videoUrl: z
    .string()
    .url('Please enter a valid YouTube URL')
    .includes('youtube.com', { message: 'Please enter a valid YouTube URL' })
    .or(z.string().includes('youtu.be', { message: 'Please enter a valid YouTube URL' })),
});

type VideoFormData = z.infer<typeof videoSchema>;

interface AnalysisFormProps {
  onAnalysisComplete: (videoId: string, isAnonymous: boolean) => void;
}

const AnalysisForm = ({ onAnalysisComplete }: AnalysisFormProps) => {
  const { activeProfileId } = useProfileContext();
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isPersonalizedOpen, setIsPersonalizedOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [anonymousProfile, setAnonymousProfile] = useState(
    () => AnonymousVideoStorage.getAnonymousProfile() || '',
  );
  const { toast } = useToast();

  const isAnonymous = !user;
  const anonymousCount = isAnonymous ? AnonymousVideoStorage.count() : 0;
  const canAnalyze = isAnonymous ? AnonymousVideoStorage.canAddMore() : true;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
  });

  useEffect(() => {
    if (user) loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    setSubscription(data);
  };

  const useSampleLink = () => {
    setValue('videoUrl', 'https://www.youtube.com/watch?v=xguam0TKMw8');
    setTimeout(() => {
      if (!isAnalyzing) handleSubmit(handleAnalyze)();
    }, 0);
  };

  const handleAnalyze = async (data: VideoFormData) => {
    if (isAnonymous && !canAnalyze) {
      setLimitModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      if (isAnonymous && anonymousProfile.trim()) {
        AnonymousVideoStorage.setAnonymousProfile(anonymousProfile.trim());
      }

      const { data: result, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl: data.videoUrl,
          profileId: activeProfileId,
          isAnonymous,
          anonymousProfile: isAnonymous && anonymousProfile.trim() ? anonymousProfile.trim() : undefined,
        },
      });

      if (error) {
        if (error.message?.includes('402')) throw new Error('Payment required. Please upgrade your plan.');
        if (error.message?.includes('429')) throw new Error('Rate limit exceeded. Please try again later.');
        throw error;
      }

      if (result?.error_code) {
        const errorMessages: Record<string, string> = {
          AI_NO_CHOICES: "The AI didn't return structured insights. Please try again.",
          AI_NO_TOOL_CALL: "The AI didn't return structured insights. Please try again.",
          AI_INVALID_STRUCTURE: 'The AI returned incomplete data. Please try again.',
          TRANSCRIPT_UNAVAILABLE: 'No transcript found; using limited metadata.',
          AI_GATEWAY_ERROR: result.error || 'AI processing error occurred.',
          RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
          PAYMENT_REQUIRED: 'Payment required. Please upgrade your plan.',
        };
        throw new Error(errorMessages[result.error_code] || result.error || 'An error occurred.');
      }

      if (isAnonymous && result) {
        const insightsWithIds = (result.insights || []).map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));
        const personalizedInsightsWithIds = (result.personalizedInsights || []).map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));
        const videoId = result.videoId || crypto.randomUUID();

        AnonymousVideoStorage.add({
          id: videoId,
          title: result.videoMetadata?.title || 'Untitled Video',
          youtube_url: data.videoUrl,
          video_id: result.videoMetadata?.video_id || '',
          analyzed_at: new Date().toISOString(),
          insights: insightsWithIds,
          personalized_insights: personalizedInsightsWithIds,
          speakers: result.videoMetadata?.speakers || [],
          tags: result.videoMetadata?.tags || [],
          profile_used: null,
          thumbnail_url: result.videoMetadata?.thumbnail_url,
          insightCount: result.insightCount,
          personalizedCount: result.personalizedCount,
        });

        onAnalysisComplete(videoId, true);
      } else if (result?.videoId) {
        onAnalysisComplete(result.videoId, false);
      }

      toast({
        title: 'Analyzed',
        description: `${result.insightCount || 0} insights extracted.`,
      });

      reset();
      setIsAdvancedOpen(false);
    } catch (error: any) {
      console.error('Analysis error:', error);
      let errorMessage = error.message || 'Failed to analyze video';
      if (error.message?.includes('network')) errorMessage = 'Network error. Check your connection and try again.';
      else if (error.message?.includes('timeout')) errorMessage = 'Request timed out. Try again in a moment.';

      toast({ title: 'Analysis failed', description: errorMessage, variant: 'destructive', duration: 5000 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const remaining = isAnonymous
    ? `${Math.max(0, 3 - anonymousCount)} free left`
    : subscription?.tier === 'free'
      ? `${subscription.videos_analyzed_this_month}/${subscription.videos_per_month} this month`
      : null;

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSubmit(handleAnalyze)} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="videoUrl" className="text-footnote font-medium flex items-center gap-1.5 text-muted-foreground">
                <Youtube className="h-3.5 w-3.5" />
                YouTube URL
              </Label>
              <button
                type="button"
                onClick={useSampleLink}
                disabled={isAnalyzing}
                className="text-caption text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Try sample
              </button>
            </div>

            <div className="relative">
              <Input
                id="videoUrl"
                type="url"
                placeholder="Paste a YouTube link…"
                {...register('videoUrl')}
                disabled={isAnalyzing}
                className="h-12 pr-32 rounded-xl text-[15px] bg-card-elevated border-border focus-visible:ring-primary/30"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isAnalyzing}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            {errors.videoUrl && (
              <p className="text-caption text-destructive">{errors.videoUrl.message}</p>
            )}

            {isAnonymous ? (
              <Collapsible open={isPersonalizedOpen} onOpenChange={setIsPersonalizedOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-footnote text-muted-foreground hover:text-foreground py-1.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      Add personal context for tailored insights
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${isPersonalizedOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-1.5">
                  <Textarea
                    id="anonymousProfile"
                    placeholder="e.g. I'm a startup founder interested in AI and venture capital…"
                    value={anonymousProfile}
                    onChange={(e) => setAnonymousProfile(e.target.value)}
                    disabled={isAnalyzing}
                    className="min-h-[72px] text-[14px] rounded-xl bg-card-elevated"
                  />
                  <p className="text-caption text-muted-foreground">
                    Optional — unlocks 10 personalized insights.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-footnote text-muted-foreground hover:text-foreground py-1.5"
                  >
                    <span>Filter through a profile</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <ProfileQuickSwitcher />
                </CollapsibleContent>
              </Collapsible>
            )}

            {remaining && (
              <p className="text-caption text-muted-foreground text-center">{remaining}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <AnonymousLimitModal open={limitModalOpen} onOpenChange={setLimitModalOpen} />
    </>
  );
};

export default AnalysisForm;
