import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import HeroSection from '@/components/HeroSection';
import AnalysisForm from '@/components/AnalysisForm';
import VideosTable from '@/components/VideosTable';
import VideoDetail from '@/components/VideoDetail';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoDetailOpen, setVideoDetailOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideoId(videoId);
    setVideoDetailOpen(true);
  };

  const handleBookmarkVideo = async (videoId: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <HeroSection />
        <AnalysisForm onAnalysisComplete={() => setRefreshTrigger(prev => prev + 1)} />
        <VideosTable
          onVideoSelect={handleVideoSelect}
          onBookmark={handleBookmarkVideo}
          refreshTrigger={refreshTrigger}
        />

        <VideoDetail
          videoId={selectedVideoId}
          open={videoDetailOpen}
          onOpenChange={setVideoDetailOpen}
        />
      </div>
    </div>
  );
};

export default Index;
