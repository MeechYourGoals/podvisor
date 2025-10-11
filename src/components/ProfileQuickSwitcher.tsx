import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProfileQuickSwitcherProps {
  selectedProfileId: string | null;
  onProfileSelect: (profileId: string | null) => void;
}

export const ProfileQuickSwitcher = ({ selectedProfileId, onProfileSelect }: ProfileQuickSwitcherProps) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_context_profiles')
        .select('id, profile_name, category')
        .eq('user_id', user.id)
        .order('profile_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Analyze with:</Label>
      <Select
        value={selectedProfileId || 'default'}
        onValueChange={(value) => onProfileSelect(value === 'default' ? null : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default Profile</SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.profile_name} ({profile.category})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Choose a profile to get insights tailored to your specific context
      </p>
    </div>
  );
};