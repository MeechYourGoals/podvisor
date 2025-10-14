import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AnonymousVideoStorage } from '@/lib/anonymousVideoStorage';
import { Loader2 } from 'lucide-react';

export const DefaultProfileSection = () => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDefaultProfile();
  }, []);

  const loadDefaultProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Authenticated: Load from database
        const { data, error } = await supabase
          .from('user_default_profiles')
          .select('description')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) setDescription(data.description);
      } else {
        // Anonymous: Load from sessionStorage
        const savedProfile = AnonymousVideoStorage.getAnonymousProfile();
        if (savedProfile) setDescription(savedProfile);
      }
    } catch (error: any) {
      console.error('Error loading default profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a description for your default profile",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (user) {
        // Authenticated: Save to database
        const { error } = await supabase
          .from('user_default_profiles')
          .upsert({
            user_id: user.id,
            description: description.trim(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Your default profile has been saved",
        });
      } else {
        // Anonymous: Save to sessionStorage
        AnonymousVideoStorage.setAnonymousProfile(description.trim());
        
        toast({
          title: "Profile saved for this session!",
          description: "Sign up to save permanently across devices",
        });
      }
    } catch (error: any) {
      console.error('Error saving default profile:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save default profile',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
      <div>
        <h3 className="text-base font-semibold mb-1">Default Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is used for all analyses unless you select a specific profile
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="default-description">Describe yourself and your goals</Label>
        <Textarea
          id="default-description"
          placeholder="e.g., I'm a retail investor focused on AI and semiconductors. I want clear takeaways and 3 concrete actions after each video."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Tell us who you are and what you want to achieve from these analyses
        </p>
        {!user && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            💡 This profile is saved for your current session. Sign up to save it permanently.
          </div>
        )}
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isSaving || !description.trim()}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Default Profile'
        )}
      </Button>
    </div>
  );
};