import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SettingsSidebar } from './SettingsSidebar';
import { ProfileQuickSwitcher } from './ProfileQuickSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const AppHeader = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full pt-safe chrome-no-select',
        'transition-all duration-200',
        scrolled
          ? 'ios-blur-bar border-b border-border'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="container flex h-12 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-semibold tracking-tight">
            Pod<span className="text-primary">visor</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {user && (
            <div className="hidden sm:block w-48">
              <ProfileQuickSwitcher compact={true} />
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu" className="md:flex hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[92vw] max-w-md overflow-y-auto">
              <SettingsSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
