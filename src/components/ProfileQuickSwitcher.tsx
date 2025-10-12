import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Globe } from 'lucide-react';
import { useProfileContext } from '@/contexts/ProfileContext';

interface ProfileQuickSwitcherProps {
  selectedProfileId?: string | null;
  onProfileSelect?: (profileId: string | null) => void;
  showGlobalOption?: boolean;
  compact?: boolean;
  showLabel?: boolean;
}

export const ProfileQuickSwitcher = ({ 
  selectedProfileId: externalSelectedId, 
  onProfileSelect: externalOnSelect,
  showGlobalOption = false,
  compact = false,
  showLabel = true
}: ProfileQuickSwitcherProps) => {
  const { profiles, isLoading, activeProfileId, setActiveProfileId } = useProfileContext();

  // Use context values if no external props provided
  const selectedProfileId = externalSelectedId !== undefined ? externalSelectedId : activeProfileId;
  const onProfileSelect = externalOnSelect || setActiveProfileId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <div className={compact ? "" : "space-y-2"}>
      {!compact && showLabel && <Label>Analyze with:</Label>}
      <Select
        value={selectedProfileId || 'default'}
        onValueChange={(value) => onProfileSelect(value === 'default' ? null : value)}
      >
        <SelectTrigger className={compact ? "w-auto" : "w-full"}>
          <SelectValue>
            {compact ? (
              currentProfile?.profile_name || "Default"
            ) : (
              <div className="flex items-center gap-2">
                <span>{currentProfile?.profile_name || "Default Profile"}</span>
                {currentProfile && (
                  <Badge variant="secondary" className="text-xs">
                    {currentProfile.category}
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">
            <div className="flex items-center gap-2">
              {showGlobalOption && <Globe className="h-3 w-3" />}
              <span>{showGlobalOption ? "Global View (All Profiles)" : "Default Profile"}</span>
            </div>
          </SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              <div className="flex items-center gap-2">
                <span>{profile.profile_name}</span>
                <Badge variant="outline" className="text-xs">
                  {profile.category}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && (
        <p className="text-xs text-muted-foreground">
          Choose a profile to get insights tailored to your specific context
        </p>
      )}
    </div>
  );
};
