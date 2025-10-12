import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Youtube, Download, Bookmark, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import InsightCard from './InsightCard';
import { useToast } from '@/hooks/use-toast';
import { BookmarkDialog } from './BookmarkDialog';
import { ProfileQuickSwitcher } from './ProfileQuickSwitcher';

interface VideoDetailProps {
  videoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Speaker {
  name: string;
  role: string;
}

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  video_id: string;
  analyzed_at: string;
  profile_used: string | null;
  speakers: Speaker[];
  tags: string[];
  experts: { name: string; credentials: string; domain: string } | null;
  content_sources: { source_name: string } | null;
}

interface Insight {
  id: string;
  insight_text: string;
  category: string;
  impact_score: number;
  actionability_score: number;
  expert_attribution?: string;
}

interface PersonalizedInsight {
  id: string;
  insight_text: string;
  relevance_score: number;
  action_items: string[];
  for_profile_context?: string;
}

const VideoDetail = ({ videoId, open, onOpenChange }: VideoDetailProps) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [personalizedInsights, setPersonalizedInsights] = useState<PersonalizedInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [selectedRefreshProfile, setSelectedRefreshProfile] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (videoId && open) {
      loadVideoData();
    }
  }, [videoId, open]);

  const loadVideoData = async () => {
    if (!videoId) return;
    setLoading(true);

    try {
      // Load video details
      const { data: videoData } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          youtube_url,
          video_id,
          analyzed_at,
          profile_used,
          speakers,
          tags,
          experts (name, credentials, domain),
          content_sources (source_name)
        `)
        .eq('id', videoId)
        .single();

      setVideo(videoData as any);

      // Load insights
      const { data: insightsData } = await (supabase as any)
        .from('insights')
        .select('*')
        .eq('video_id', videoId)
        .order('impact_score', { ascending: false });

      setInsights(insightsData || []);

      // Load personalized insights
      const { data: personalizedData } = await (supabase as any)
        .from('personalized_insights')
        .select('*')
        .eq('video_id', videoId)
        .order('relevance_score', { ascending: false });

      setPersonalizedInsights(personalizedData || []);
    } catch (error) {
      console.error('Error loading video data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkInsight = async (insightId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('bookmarked_insights')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          insight_id: insightId,
          folder_id: null,
        });

      if (error) throw error;

      toast({
        title: "Bookmarked!",
        description: "Insight saved to your bookmarks",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBookmarkVideo = () => {
    setBookmarkDialogOpen(true);
  };

  const handleRefreshAnalysis = async () => {
    if (!video) return;
    
    setIsRefreshing(true);
    setShowProfileSelector(false);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl: video.youtube_url,
          profileId: selectedRefreshProfile,
          isRefresh: true,
          existingVideoId: video.id,
        },
      });

      if (error) {
        if (error.message?.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.message?.includes('402')) {
          throw new Error('Payment required. Please add credits to continue.');
        }
        throw error;
      }

      if (result?.error_code) {
        const errorMessages: Record<string, string> = {
          'AI_NO_CHOICES': "The AI didn't return structured insights. Please try again.",
          'AI_NO_TOOL_CALL': "The AI didn't return structured insights. Please try again.",
          'AI_INVALID_STRUCTURE': "The AI returned incomplete data. Please try again.",
          'TRANSCRIPT_UNAVAILABLE': "No transcript found; using limited metadata.",
          'AI_GATEWAY_ERROR': result.error || 'AI processing error occurred.',
          'RATE_LIMIT': 'Rate limit exceeded. Please try again later.',
          'PAYMENT_REQUIRED': 'Payment required. Please upgrade your plan.',
        };
        
        throw new Error(errorMessages[result.error_code] || result.error);
      }

      let successMessage = `Insights refreshed! ${result.insightCount || 0} new insights extracted.`;
      
      if (result.transcriptSource === 'perplexity') {
        successMessage += ' (AI analysis method)';
      } else if (result.transcriptSource === 'metadata-only') {
        successMessage += ' (Limited - metadata only)';
      }
      
      toast({
        title: "Success!",
        description: successMessage,
      });

      if (result?.warnings && Array.isArray(result.warnings)) {
        result.warnings.forEach((warning: string) => {
          toast({
            title: "Note",
            description: warning,
            variant: "default",
          });
        });
      }

      await loadVideoData();
      setSelectedRefreshProfile(null);
      
    } catch (error: any) {
      console.error('Refresh error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to refresh insights',
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    if (!video || !insights) return;

    const markdown = `# ${video.title}

**Expert**: ${video.experts?.name || 'Unknown'}
**Domain**: ${video.experts?.domain || 'Unknown'}
**Source**: ${video.content_sources?.source_name || 'YouTube'}
**URL**: ${video.youtube_url}

## Universal Insights

${insights.map((insight, i) => `
### ${i + 1}. ${insight.category}
**Impact**: ${insight.impact_score}/10 | **Actionability**: ${insight.actionability_score}/10

${insight.insight_text}
`).join('\n')}

${personalizedInsights.length > 0 ? `
## Personalized Insights

${personalizedInsights.map((insight, i) => `
### ${i + 1}. Personalized
**Relevance**: ${insight.relevance_score}/10

${insight.insight_text}

${insight.action_items?.length > 0 ? `**Action Items**:
${insight.action_items.map(item => `- ${item}`).join('\n')}` : ''}
`).join('\n')}` : ''}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Video insights exported as Markdown",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto pb-safe pt-safe">
        <SheetHeader>
          {loading || !video ? (
            <>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <SheetTitle className="text-left">{video.title}</SheetTitle>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={video.profile_used === 'default' ? 'secondary' : 'default'}
                      className="text-xs capitalize"
                    >
                      Viewed through: {video.profile_used || 'default'}
                    </Badge>
                  </div>

                  {/* Speaker(s) */}
                  {video.speakers && video.speakers.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Speaker(s):</span>
                      {video.speakers
                        .filter(s => s.role === "interviewee" || s.role === "guest")
                        .map((speaker, idx) => (
                          <Badge key={idx} variant="secondary">
                            {speaker.name}
                          </Badge>
                        ))}
                    </div>
                  )}

                  {/* Tags */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Tags:</span>
                      {video.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Source */}
                  <SheetDescription className="text-left">
                    {video.content_sources && (
                      <p className="text-sm">
                        Source: {video.content_sources.source_name}
                      </p>
                    )}
                  </SheetDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setShowProfileSelector(!showProfileSelector)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(video.youtube_url, '_blank')}
                  >
                    <Youtube className="h-4 w-4 mr-1" />
                    Watch
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBookmarkVideo}>
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Profile Selector for Refresh */}
              {showProfileSelector && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-3">Select a profile to refresh insights:</p>
                  <ProfileQuickSwitcher
                    selectedProfileId={selectedRefreshProfile}
                    onProfileSelect={setSelectedRefreshProfile}
                  />
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleRefreshAnalysis} disabled={isRefreshing}>
                      {isRefreshing ? 'Analyzing...' : 'Refresh Now'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowProfileSelector(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">
                  All Insights ({insights.length})
                </TabsTrigger>
                <TabsTrigger value="personal">
                  For You ({personalizedInsights.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4 mt-4">
                {insights.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No insights available for this video.
                  </p>
                ) : (
                  insights.map((insight, index) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onBookmark={handleBookmarkInsight}
                      index={index}
                      isPersonalized={false}
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent value="personal" className="space-y-4 mt-4">
                {personalizedInsights.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-muted-foreground">
                      No personalized insights for this video.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Analyze videos with a profile to unlock personalized insights!
                    </p>
                  </div>
                ) : (
                  personalizedInsights.map((insight, index) => (
                    <InsightCard
                      key={insight.id}
                      insight={{
                        id: insight.id,
                        insight_text: insight.insight_text,
                        category: 'Personalized',
                        impact_score: insight.relevance_score,
                        actionability_score: insight.relevance_score,
                        for_profile_context: insight.for_profile_context,
                      }}
                      onBookmark={handleBookmarkInsight}
                      actionItems={insight.action_items}
                      index={index}
                      isPersonalized={true}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <BookmarkDialog
          open={bookmarkDialogOpen}
          onOpenChange={setBookmarkDialogOpen}
          videoId={videoId || undefined}
          type="video"
        />
      </SheetContent>
    </Sheet>
  );
};

export default VideoDetail;