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
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { ComparisonSection } from '@/components/marketing/ComparisonSection';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import { PricingSection } from '@/components/marketing/PricingSection';
import { PricingCards } from '@/components/marketing/PricingCards';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';
import { Footer } from '@/components/marketing/Footer';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnonymousVideoStorage } from '@/lib/anonymousVideoStorage';
import { AudioUploadForm } from '@/components/AudioUploadForm';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoDetailOpen, setVideoDetailOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadSubscription();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideoId(videoId);
    setVideoDetailOpen(true);
  };

  const handleBookmarkVideo = async (videoId: string) => {
    if (!user) {
      toast({ title: 'Sign up to save bookmarks', description: 'Create a free account to bookmark videos.' });
      navigate('/auth');
      return;
    }
    try {
      const { error } = await (supabase as any)
        .from('bookmarked_videos')
        .insert({ user_id: user?.id, video_id: videoId, folder_id: null });
      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already bookmarked', description: 'This video is already in your bookmarks.' });
        } else throw error;
      } else {
        toast({ title: 'Bookmarked', description: 'Saved to your bookmarks.' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const isAnonymous = !user;
  const anonymousVideos = isAnonymous ? AnonymousVideoStorage.getAll() : [];

  return (
    <div className="relative min-h-screen bg-background">
      <AppHeader />
      {user && <WelcomeDialog />}

      <main className="container max-w-4xl pb-tabbar md:pb-12">
        {isAnonymous ? (
          <>
            <MarketingHero />

            <section id="try" className="py-6 space-y-4">
              {anonymousVideos.length > 0 && <AnonymousUserBanner />}
              <AnalysisForm
                onAnalysisComplete={(videoId) => {
                  setRefreshTrigger((p) => p + 1);
                  setSelectedVideoId(videoId);
                  setVideoDetailOpen(true);
                }}
              />
              <AudioUploadForm
                onAnalysisComplete={(audioId) => {
                  setRefreshTrigger((p) => p + 1);
                  setSelectedVideoId(audioId);
                  setVideoDetailOpen(true);
                }}
                subscription={subscription}
              />

              {anonymousVideos.length > 0 && (
                <div className="pt-6">
                  <h2 className="ios-section-header pl-0">Your analyses</h2>
                  <VideosTable
                    onVideoSelect={handleVideoSelect}
                    onBookmark={handleBookmarkVideo}
                    refreshTrigger={refreshTrigger}
                    isAnonymous={true}
                    anonymousVideos={anonymousVideos}
                  />
                </div>
              )}
            </section>

            <div className="space-y-20 py-12">
              <HowItWorksSection />
              <ComparisonSection />
              <TestimonialsSection />
              <PricingSection />
              <PricingCards />
            </div>
          </>
        ) : (
          <div className="pt-4">
            <HeroSection />
            <AnalysisForm
              onAnalysisComplete={(videoId) => {
                setRefreshTrigger((p) => p + 1);
                setSelectedVideoId(videoId);
                setVideoDetailOpen(true);
              }}
            />
            <AudioUploadForm
              onAnalysisComplete={(audioId) => {
                setRefreshTrigger((p) => p + 1);
                setSelectedVideoId(audioId);
                setVideoDetailOpen(true);
              }}
              subscription={subscription}
            />

            <h2 className="ios-section-header pl-0">Library</h2>
            <VideosTable
              onVideoSelect={handleVideoSelect}
              onBookmark={handleBookmarkVideo}
              refreshTrigger={refreshTrigger}
              isAnonymous={false}
              anonymousVideos={[]}
            />
          </div>
        )}

        <VideoDetail
          videoId={selectedVideoId}
          open={videoDetailOpen}
          onOpenChange={setVideoDetailOpen}
          isAnonymous={isAnonymous}
          anonymousVideos={anonymousVideos}
        />
      </main>

      {isAnonymous && <Footer />}
    </div>
  );
};

export default Index;
