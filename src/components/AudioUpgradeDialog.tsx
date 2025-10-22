import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AudioUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AudioUpgradeDialog = ({ open, onOpenChange }: AudioUpgradeDialogProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    // Scroll to pricing section
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Audio Upload Requires Pro
          </AlertDialogTitle>
          <AlertDialogDescription>
            Upgrade to Pro to analyze unlimited audio files, podcasts, meetings, lectures, and more. Get personalized insights from any audio content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpgrade}>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
