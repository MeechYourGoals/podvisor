import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome dialog
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle>Welcome to YAYA!</DialogTitle>
          </div>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              Your AI-powered video analysis platform. Extract personalized insights from any YouTube video.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">Get started in 3 steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Paste any YouTube URL</li>
                <li>Create a profile to personalize insights</li>
                <li>Get AI-powered analysis tailored to your goals</li>
              </ol>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-2">
          <Button onClick={handleClose}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
