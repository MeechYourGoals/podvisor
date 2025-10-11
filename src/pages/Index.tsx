import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import HeroSection from '@/components/HeroSection';
import AnalysisForm from '@/components/AnalysisForm';
import VideosTable from '@/components/VideosTable';
import VideoDetail from '@/components/VideoDetail';
import BookmarksPanel from '@/components/BookmarksPanel';
import { Button } from '@/components/ui/button';
import { Bookmark, LogOut, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoDetailOpen, setVideoDetailOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-end items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setBookmarksOpen(true)}
          >
            <Bookmark className="h-5 w-5" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <LogOut className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <Button onClick={signOut} variant="outline" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

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

        <BookmarksPanel
          open={bookmarksOpen}
          onOpenChange={setBookmarksOpen}
          onVideoSelect={handleVideoSelect}
        />
      </div>
    </div>
  );
};

export default Index;
