import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import HeroSection from '@/components/HeroSection';
import AnalysisForm from '@/components/AnalysisForm';
import { Button } from '@/components/ui/button';
import { Bookmark, LogOut, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-end items-center gap-2 mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Bookmark className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings & Bookmarks</SheetTitle>
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
        <AnalysisForm onAnalysisComplete={() => {
          // Refresh data
        }} />
      </div>
    </div>
  );
};

export default Index;
