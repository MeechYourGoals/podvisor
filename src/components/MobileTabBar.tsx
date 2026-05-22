import { NavLink } from 'react-router-dom';
import { Home, Library, FolderOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  to: string;
  label: string;
  icon: typeof Home;
}

const tabs: Tab[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/?tab=library', label: 'Library', icon: Library },
  { to: '/?tab=folders', label: 'Folders', icon: FolderOpen },
  { to: '/?tab=profile', label: 'Profile', icon: User },
];

export const MobileTabBar = () => {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'md:hidden fixed inset-x-0 bottom-0 z-40',
        'ios-blur-bar border-t border-border',
        'chrome-no-select',
      )}
    >
      <ul className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, label, icon: Icon }) => {
          const search = to.includes('?') ? to.split('?')[1] : '';
          const path = to.split('?')[0];
          const isActive =
            typeof window !== 'undefined' &&
            window.location.pathname === path &&
            (search ? window.location.search.includes(search.split('=')[1]) : !window.location.search.includes('tab='));

          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[56px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="text-[10px] font-medium tracking-tight">{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
