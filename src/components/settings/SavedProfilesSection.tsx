import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { ProfileFormDialog } from '../ProfileFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const SavedProfilesSection = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<any>(null);
  const [folderCount, setFolderCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
    loadSubscription();
  }, []);

  // Check for over-limit users on mount
  useEffect(() => {
    if (subscription && profiles.length > 0) {
      const profileLimit = subscription.profile_limit || 3;
      if (profiles.length > profileLimit) {
        setShowLimitModal(true);
      }
    }
  }, [subscription, profiles]);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleNewProfile = () => {
    if (!subscription) return;

    const profileLimit = subscription.profile_limit || 3;
    
    // Check if at or over limit
    if (profiles.length >= profileLimit) {
      if (subscription.tier === 'free') {
        toast({
          title: "Profile limit reached",
          description: `Free plan: ${profiles.length}/${profileLimit} profiles. Upgrade to Pro for up to 10 profiles!`,
          variant: "destructive",
        });
      } else {
        // Pro/Annual users at 10/10
        toast({
          title: "Profile limit reached",
          description: `You've reached the maximum of ${profileLimit} profiles. Delete an existing profile to create a new one.`,
          variant: "destructive",
        });
      }
      return;
    }

    // Warning at 8/10 for paid users
    if (subscription.tier !== 'free' && profiles.length === 8) {
      toast({
        title: "Approaching limit",
        description: `You're at ${profiles.length}/${profileLimit} profiles. Consider removing unused profiles.`,
      });
    }

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

  const handleDeleteClick = async (profile: any) => {
    // Count folders linked to this profile
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('bookmark_folders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('profile_id', profile.id);

      setFolderCount(count || 0);
      setProfileToDelete(profile);
      setDeleteConfirmOpen(true);
    } catch (error) {
      console.error('Error counting folders:', error);
      setProfileToDelete(profile);
      setFolderCount(0);
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;

    try {
      const { error } = await supabase
        .from('user_context_profiles')
        .delete()
        .eq('id', profileToDelete.id);

      if (error) throw error;

      const message = folderCount > 0
        ? `Profile deleted. ${folderCount} folder${folderCount === 1 ? '' : 's'} moved to Global view.`
        : 'Profile deleted successfully';

      toast({
        title: "Success",
        description: message,
      });

      setDeleteConfirmOpen(false);
      setProfileToDelete(null);
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

  const handleForcedDelete = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('user_context_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Profile deleted",
        description: "Continue deleting profiles to get under your limit",
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
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Saved Profiles</h3>
          {subscription && (
            <Badge variant="outline" className="text-xs">
              {profiles.length}/{subscription.profile_limit || 3}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={handleNewProfile} disabled={!subscription}>
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
                    onClick={() => handleDeleteClick(profile)}
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

      {/* Deletion confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {folderCount > 0 ? (
                <>
                  This will delete the profile <strong>"{profileToDelete?.profile_name}"</strong>.
                  <br /><br />
                  <strong>{folderCount} folder{folderCount === 1 ? '' : 's'}</strong> linked to this profile will become <strong>Global</strong> (visible across all profiles).
                  <br /><br />
                  Your bookmarks will not be lost.
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>"{profileToDelete?.profile_name}"</strong>?
                  <br /><br />
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forced deletion modal for users over limit */}
      <Dialog open={showLimitModal} onOpenChange={(open) => {
        // Prevent closing if still over limit
        if (!open && subscription) {
          const profileLimit = subscription.profile_limit || 3;
          if (profiles.length > profileLimit) {
            toast({
              title: "Action required",
              description: "You must delete profiles to continue",
              variant: "destructive",
            });
            return;
          }
        }
        setShowLimitModal(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Profile Limit Update
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                We've updated our limits to <strong>{subscription?.profile_limit || 10} profiles</strong> per user.
              </p>
              <p>
                You currently have <strong>{profiles.length} profiles</strong>. Please delete{' '}
                <strong>{profiles.length - (subscription?.profile_limit || 10)}</strong> profile
                {profiles.length - (subscription?.profile_limit || 10) === 1 ? '' : 's'} to continue.
              </p>
              <p className="text-xs text-muted-foreground">
                Note: Deleting a profile moves its folders to Global view. Your bookmarks will not be lost.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{profile.profile_name}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {profile.category}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleForcedDelete(profile.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowLimitModal(false)}
              disabled={subscription && profiles.length > (subscription.profile_limit || 3)}
              className="w-full"
            >
              {subscription && profiles.length > (subscription.profile_limit || 3)
                ? `Delete ${profiles.length - (subscription.profile_limit || 3)} more to continue`
                : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};