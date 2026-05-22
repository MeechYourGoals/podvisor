import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AnonymousVideoStorage } from '@/lib/anonymousVideoStorage';
import { AnonymousAudioStorage } from '@/lib/anonymousAudioStorage';
import { ArrowRight } from 'lucide-react';

export const AnonymousUserBanner = () => {
  const navigate = useNavigate();
  const videoCount = AnonymousVideoStorage.count();
  const videoRemaining = AnonymousVideoStorage.getRemaining();
  const audioCount = AnonymousAudioStorage.count();
  const audioRemaining = AnonymousAudioStorage.getRemaining();

  if (videoCount === 0 && audioCount === 0) return null;

  const hasRemaining = videoRemaining > 0 || audioRemaining > 0;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card-elevated px-4 py-3">
      <div className="min-w-0">
        <p className="text-[14px] font-medium leading-tight">
          {hasRemaining
            ? `${videoRemaining} video · ${audioRemaining} audio left`
            : `Free trials used`}
        </p>
        <p className="text-caption text-muted-foreground mt-0.5">
          Sign up free for 4 videos & 2 audio uploads / month
        </p>
      </div>
      <Button size="sm" onClick={() => navigate('/auth')} className="shrink-0">
        Sign up
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
