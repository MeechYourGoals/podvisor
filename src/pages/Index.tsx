import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import HeroSection from '@/components/HeroSection';
import AnalysisForm from '@/components/AnalysisForm';
import VideosTable from '@/components/VideosTable';
import VideoDetail from '@/components/VideoDetail';
import { WelcomeDialog } from '@/components/WelcomeDialog';
import { AnonymousUserBanner } from '@/components/AnonymousUserBanner';
import { ComparisonSection } from '@/components/marketing/ComparisonSection';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import { PricingSection } from '@/components/marketing/PricingSection';
import { PricingCards } from '@/components/marketing/PricingCards';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnonymousVideoStorage } from '@/lib/anonymousVideoStorage';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoDetailOpen, setVideoDetailOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  // Don't redirect anonymous users - let them use the app
  // useEffect removed - no auth wall

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideoId(videoId);
    setVideoDetailOpen(true);
  };

  const handleBookmarkVideo = async (videoId: string) => {
    if (!user) {
      toast({
        title: "Sign up to save bookmarks",
        description: "Create a free account to bookmark videos and save your work",
      });
      navigate('/auth');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('bookmarked_videos')
        .insert({
          user_id: user?.id,
          video_id: videoId,
          folder_id: null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already bookmarked",
            description: "This video is already in your bookmarks",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Bookmarked!",
          description: "Video saved to your bookmarks",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isAnonymous = !user;
  const anonymousVideos = isAnonymous ? AnonymousVideoStorage.getAll() : [];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 bg-gradient-mesh opacity-20 blur-3xl pointer-events-none"></div>
      
      <div className="relative">
        <AppHeader />
        {user && <WelcomeDialog />}
        
        <div className="container mx-auto px-4 py-6 max-w-6xl">
        <HeroSection />
        {isAnonymous && anonymousVideos.length > 0 && <AnonymousUserBanner />}
        <AnalysisForm onAnalysisComplete={(videoId) => {
          setRefreshTrigger(prev => prev + 1);
          setSelectedVideoId(videoId);
          setVideoDetailOpen(true);
        }} />
        <VideosTable
          onVideoSelect={handleVideoSelect}
          onBookmark={handleBookmarkVideo}
          refreshTrigger={refreshTrigger}
          isAnonymous={isAnonymous}
          anonymousVideos={anonymousVideos}
        />

        <VideoDetail
          videoId={selectedVideoId}
          open={videoDetailOpen}
          onOpenChange={setVideoDetailOpen}
          isAnonymous={isAnonymous}
          anonymousVideos={anonymousVideos}
        />

        {/* Marketing Sections - Show for anonymous users */}
        {isAnonymous && (
          <div className="mt-20 space-y-16 max-w-5xl mx-auto">
            <ComparisonSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <PricingSection />
            <PricingCards />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Index;
