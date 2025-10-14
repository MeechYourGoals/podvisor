import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SettingsSidebar } from './SettingsSidebar';
import { ProfileQuickSwitcher } from './ProfileQuickSwitcher';
import { useAuth } from '@/hooks/useAuth';

export const AppHeader = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
      <div className="container flex h-12 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-display font-bold text-foreground">
            Podvisor
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:block w-48">
              <ProfileQuickSwitcher compact={true} />
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] max-w-md overflow-y-auto">
              <SettingsSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};