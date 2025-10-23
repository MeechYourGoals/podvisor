import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { AnonymousVideoStorage } from '@/lib/anonymousVideoStorage';
import { AnonymousAudioStorage } from '@/lib/anonymousAudioStorage';
import { Sparkles, Crown } from 'lucide-react';

export const AnonymousUserBanner = () => {
  const navigate = useNavigate();
  const videoCount = AnonymousVideoStorage.count();
  const videoRemaining = AnonymousVideoStorage.getRemaining();
  const audioCount = AnonymousAudioStorage.count();
  const audioRemaining = AnonymousAudioStorage.getRemaining();

  if (videoCount === 0 && audioCount === 0) return null;

  return (
    <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 mb-6">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-lg mb-1">
                {videoRemaining > 0 || audioRemaining > 0
                  ? `Try ${videoRemaining} more YouTube ${videoRemaining === 1 ? 'analysis' : 'analyses'} and ${audioRemaining} audio upload`
                  : `You've used all free trials`
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Sign up to unlock 4 YouTube analyses & 2 audio uploads/month, plus 2 custom profiles (free tier)
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/auth')}
            className="gap-2 whitespace-nowrap"
            size="lg"
          >
            <Crown className="h-4 w-4" />
            Sign Up Free
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
