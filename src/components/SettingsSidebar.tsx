import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DefaultProfileSection } from './settings/DefaultProfileSection';
import { SavedProfilesSection } from './settings/SavedProfilesSection';
import { BookmarksSection } from './settings/BookmarksSection';
import { SubscriptionSection } from './settings/SubscriptionSection';
import { AccountSection } from './settings/AccountSection';

export const SettingsSidebar = () => {
  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 text-lg font-semibold">Settings</h2>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="bookmarks">Saved</TabsTrigger>
          <TabsTrigger value="subscription">Plan</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4 mt-4">
          <DefaultProfileSection />
          <SavedProfilesSection />
        </TabsContent>
        
        <TabsContent value="bookmarks" className="mt-4">
          <BookmarksSection />
        </TabsContent>
        
        <TabsContent value="subscription" className="mt-4">
          <SubscriptionSection />
        </TabsContent>
        
        <TabsContent value="account" className="mt-4">
          <AccountSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};