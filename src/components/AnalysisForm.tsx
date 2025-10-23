import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, ChevronDown, Sparkles, Crown } from 'lucide-react';
import { ProfileQuickSwitcher } from './ProfileQuickSwitcher';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useAuth } from '@/hooks/useAuth';
import { AnonymousVideoStorage } from '@/lib/anonymousVideoStorage';
import { AnonymousLimitModal } from './AnonymousLimitModal';

const videoSchema = z.object({
  videoUrl: z.string().url('Please enter a valid YouTube URL').includes('youtube.com', { message: 'Please enter a valid YouTube URL' }).or(z.string().includes('youtu.be', { message: 'Please enter a valid YouTube URL' })),
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
  const [anonymousProfile, setAnonymousProfile] = useState(() => {
    // Load from sessionStorage if exists
    return AnonymousVideoStorage.getAnonymousProfile() || '';
  });
  const { toast } = useToast();

  const isAnonymous = !user;
  const anonymousCount = isAnonymous ? AnonymousVideoStorage.count() : 0;
  const canAnalyze = isAnonymous ? AnonymousVideoStorage.canAddMore() : true;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
  });

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
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
    // Immediately trigger analysis after setting sample URL
    setTimeout(() => {
      if (!isAnalyzing) {
        handleSubmit(handleAnalyze)();
      }
    }, 0);
  };

  const handleAnalyze = async (data: VideoFormData) => {
    // Check anonymous limit before starting
    if (isAnonymous && !canAnalyze) {
      setLimitModalOpen(true);
      console.log('[Analytics] Anonymous limit reached - modal shown');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Save anonymous profile to sessionStorage if provided
      if (isAnonymous && anonymousProfile.trim()) {
        AnonymousVideoStorage.setAnonymousProfile(anonymousProfile.trim());
      }

      const { data: result, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl: data.videoUrl,
          profileId: activeProfileId,
          isAnonymous: isAnonymous,
          anonymousProfile: isAnonymous && anonymousProfile.trim() ? anonymousProfile.trim() : undefined,
        },
      });

      if (error) {
        if (error.message?.includes('402') || error.message?.includes('Payment')) {
          throw new Error('Payment required. Please upgrade your plan.');
        }
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw error;
      }

      // Handle error codes from edge function
      if (result?.error_code) {
        const errorMessages: Record<string, string> = {
          'AI_NO_CHOICES': "The AI didn't return structured insights. Please try again or another video.",
          'AI_NO_TOOL_CALL': "The AI didn't return structured insights. Please try again or another video.",
          'AI_INVALID_STRUCTURE': "The AI returned incomplete data. Please try again.",
          'TRANSCRIPT_UNAVAILABLE': "No transcript found; using limited metadata. Results may be lighter.",
          'AI_GATEWAY_ERROR': result.error || 'AI processing error occurred.',
          'RATE_LIMIT': 'Rate limit exceeded. Please try again later.',
          'PAYMENT_REQUIRED': 'Payment required. Please upgrade your plan.',
        };
        
        const message = errorMessages[result.error_code] || result.error || 'An error occurred during analysis.';
        throw new Error(message);
      }

      // For anonymous users, store in sessionStorage
      if (isAnonymous && result) {
        // Add unique IDs to insights and personalized insights
        const insightsWithIds = (result.insights || []).map((insight: any) => ({
          ...insight,
          id: insight.id || crypto.randomUUID()
        }));
        
        const personalizedInsightsWithIds = (result.personalizedInsights || []).map((insight: any) => ({
          ...insight,
          id: insight.id || crypto.randomUUID()
        }));

        const videoId = result.videoId || crypto.randomUUID();
        const anonymousVideo = {
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
        };

        AnonymousVideoStorage.add(anonymousVideo);
        console.log('[Analytics] Anonymous video analysis', {
          videoCount: AnonymousVideoStorage.count(),
          timestamp: new Date().toISOString()
        });

        // Call completion callback with video ID and anonymous flag
        onAnalysisComplete(videoId, true);
      } else if (result?.videoId) {
        // For authenticated users, call with videoId from database
        onAnalysisComplete(result.videoId, false);
      }

      // Success with possible warnings
      let successMessage = `Video analyzed! ${result.insightCount || 0} insights extracted.`;
      
      if (result.transcriptSource === 'perplexity') {
        successMessage += ' (AI analysis method)';
      } else if (result.transcriptSource === 'metadata-only') {
        successMessage += ' (Limited - metadata only)';
      }
      
      toast({
        title: "Success!",
        description: successMessage,
      });
      
      // Show warnings if any
      if (result?.warnings && Array.isArray(result.warnings)) {
        result.warnings.forEach((warning: string) => {
          toast({
            title: "Note",
            description: warning,
            variant: "default",
          });
        });
      }

      // Note: onAnalysisComplete is now called earlier in the anonymous/authenticated blocks
      reset();
      setIsAdvancedOpen(false);
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Mobile-friendly error messages with clear guidance
      let errorMessage = error.message || 'Failed to analyze video';
      
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        errorMessage = '⚠️ Network error. Check your connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '⏱️ Request timed out. Try a shorter video or retry in a moment.';
      } else if (error.message?.includes('Invalid YouTube URL')) {
        errorMessage = '🎥 Invalid YouTube link. Make sure it\'s a valid YouTube video URL.';
      } else if (error.message?.includes('Rate limit')) {
        errorMessage = '⏸️ Too many requests. Please wait a moment and try again.';
      } else if (error.message?.includes('Payment')) {
        errorMessage = '💳 Upgrade required. Sign up for a Pro account to continue.';
      }
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Card className="mb-8 border-2 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-center space-y-1 mb-2">
                <div className="text-2xl font-semibold">YAYA</div>
                <div className="text-base font-normal text-muted-foreground">Your AI YouTube Advisor</div>
              </CardTitle>
              <CardDescription className="text-center">
                Paste any YouTube URL to extract expert insights
              </CardDescription>
            </div>
            {isAnonymous && (
              <Badge variant="secondary" className="text-xs absolute top-6 right-6">
                {anonymousCount}/3 free
              </Badge>
            )}
          </div>
          {!isAnonymous && subscription && subscription.tier === 'free' && (
            <Badge variant="secondary" className="text-xs">
              {subscription.videos_analyzed_this_month}/{subscription.videos_per_month} used
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isAnonymous && anonymousCount > 0 && (
            <div className="mb-4 p-3 bg-muted/50 border rounded-lg">
              <p className="text-sm">
                <strong>Free trial active:</strong> Sign up to save analyses and unlock 4/month
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit(handleAnalyze)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="videoUrl">YouTube Video URL</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useSampleLink}
                disabled={isAnalyzing}
                className="h-auto py-1 text-xs"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Use sample
              </Button>
            </div>
            <Input
              id="videoUrl"
              type="url"
              placeholder="YouTube URL..."
              {...register('videoUrl')}
              disabled={isAnalyzing}
            />
            {errors.videoUrl && (
              <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
            )}
          </div>

          {isAnonymous ? (
            <Collapsible open={isPersonalizedOpen} onOpenChange={setIsPersonalizedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  <span className="text-sm flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Get Personalized Insights (Optional)
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isPersonalizedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-2">
                <Label htmlFor="anonymousProfile" className="text-sm">
                  Tell us about yourself for personalized insights
                </Label>
                <Textarea
                  id="anonymousProfile"
                  placeholder="Example: I'm a startup founder interested in AI and venture capital..."
                  value={anonymousProfile}
                  onChange={(e) => setAnonymousProfile(e.target.value)}
                  disabled={isAnalyzing}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Add context to get 10 personalized insights tailored to your goals
                </p>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  <span className="text-sm">Advanced: Filter through a profile</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <ProfileQuickSwitcher />
              </CollapsibleContent>
            </Collapsible>
          )}

          <Button type="submit" className="w-full" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Analyze Video
              </>
            )}
          </Button>

          {!isAnonymous && (
            <p className="text-xs text-muted-foreground text-center">
              {activeProfileId ? 'Analyzing with selected profile' : 'Analyzing with your default profile'}
            </p>
          )}
        </form>
      </CardContent>
    </Card>

    <AnonymousLimitModal open={limitModalOpen} onOpenChange={setLimitModalOpen} />
    </>
  );
};

export default AnalysisForm;