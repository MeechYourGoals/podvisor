import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { ProfileFormDialog } from '../ProfileFormDialog';

export const SavedProfilesSection = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const { toast } = useToast();

  const handleNewProfile = () => {
    setSelectedProfile(null);
    setDialogOpen(true);
  };

  const handleEditProfile = (profile: any) => {
    setSelectedProfile(profile);
    setDialogOpen(true);
  };

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
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('user_context_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile deleted successfully",
      });

      loadProfiles();
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Saved Profiles</h3>
        <Button size="sm" variant="outline" onClick={handleNewProfile}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No saved profiles yet. Create one to get started!
        </p>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{profile.profile_name}</div>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {profile.category}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEditProfile(profile)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(profile.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {profile.role_description}
              </p>
            </div>
          ))}
        </div>
      )}

      <ProfileFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={selectedProfile}
        onSuccess={loadProfiles}
      />
    </div>
  );
};