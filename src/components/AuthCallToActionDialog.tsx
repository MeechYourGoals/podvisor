import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Download, Folder, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthCallToActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: 'profile' | 'export' | 'bookmark';
}

const contextConfig = {
  profile: {
    icon: Sparkles,
    title: 'Unlock Personalized Insights',
    description: 'Create custom profiles to get AI-powered insights tailored to your specific role, goals, and challenges. Free tier includes 3 profiles.',
    benefits: [
      'Personalized action items for your goals',
      '3 custom context profiles (free tier)',
      '10 video analyses per month',
    ],
  },
  export: {
    icon: Download,
    title: 'Export Your Analysis',
    description: 'Sign up to export video insights in JSON, CSV, or Markdown format. Perfect for sharing with your team or importing into your workflow.',
    benefits: [
      'Export in 3 formats (JSON, CSV, Markdown)',
      'Save unlimited bookmarks',
      '10 free analyses per month',
    ],
  },
  bookmark: {
    icon: Folder,
    title: 'Save & Organize Videos',
    description: 'Create an account to organize your analyzed videos into custom folders. Never lose track of valuable insights again.',
    benefits: [
      'Unlimited bookmark folders',
      'Profile-specific organization',
      'Export collections as Markdown',
    ],
  },
};

export const AuthCallToActionDialog = ({ open, onOpenChange, context }: AuthCallToActionDialogProps) => {
  const navigate = useNavigate();
  const config = contextConfig[context];
  const Icon = config.icon;

  const handleSignUp = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  const handleSignIn = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl">{config.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {config.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <p className="text-sm text-foreground">{benefit}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSignUp}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Sign Up Free
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={handleSignIn}
                className="text-primary hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
