import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  profile_name: z.string().min(1, 'Profile name is required'),
  category: z.enum(['business', 'sports', 'health_fitness', 'technology', 'personal_development', 'finance', 'entertainment', 'education', 'general']),
  role_description: z.string().min(1, 'Current role is required'),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  goals: z.string().min(10, 'Please describe your goals (at least 10 characters)'),
  challenges: z.string().min(1, 'Please describe your challenges'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ContextProfileFormProps {
  onProfileSelect: (profileId: string | null) => void;
  onAnalyze: () => void;
  onSkip: () => void;
  isAnalyzing: boolean;
}

const ContextProfileForm = ({ onProfileSelect, onAnalyze, onSkip, isAnalyzing }: ContextProfileFormProps) => {
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [useSavedProfile, setUseSavedProfile] = useState(false);
  const [saveAsProfile, setSaveAsProfile] = useState(false);
  const [selectedSavedProfile, setSelectedSavedProfile] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const category = watch('category');

  useEffect(() => {
    if (user) {
      loadProfiles();
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    const { data } = await (supabase as any)
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    setSubscription(data);
  };

  const loadProfiles = async () => {
    const { data, error } = await (supabase as any)
      .from('user_context_profiles')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading profiles:', error);
      return;
    }

    setSavedProfiles(data || []);
  };

  const handleSavedProfileChange = (profileId: string) => {
    setSelectedSavedProfile(profileId);
    const profile = savedProfiles.find(p => p.id === profileId);
    if (profile) {
      setValue('profile_name', profile.profile_name);
      setValue('category', profile.category);
      setValue('role_description', profile.role_description);
      setValue('experience_level', profile.experience_level);
      setValue('goals', profile.goals);
      setValue('challenges', profile.challenges);
      onProfileSelect(profileId);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (saveAsProfile && user) {
      const profileLimit = subscription?.profile_limit || 3;
      if (savedProfiles.length >= profileLimit) {
        const tierName = subscription?.tier === 'pro' || subscription?.tier === 'annual' ? 'Pro' : 'Free';
        toast({
          title: "Profile limit reached",
          description: `${tierName} plan: ${savedProfiles.length}/${profileLimit} profiles saved. ${subscription?.tier === 'free' ? 'Upgrade to Pro for unlimited profiles!' : 'Delete one to save a new profile.'}`,
          variant: "destructive",
        });
        return;
      }

      try {
        const { data: newProfile, error } = await (supabase as any)
          .from('user_context_profiles')
          .insert({
            user_id: user.id,
            ...data,
          })
          .select()
          .single();

        if (error) throw error;
        if (!newProfile) throw new Error('Failed to create profile');

        onProfileSelect(newProfile.id);
        toast({
          title: "Profile saved!",
          description: "Your context profile has been saved for future use.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    onAnalyze();
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Sign in to save profiles and get personalized insights</p>
        <Button onClick={onSkip} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Continue Without Profile'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {savedProfiles.length > 0 && (
        <div className="flex items-center space-x-2">
          <Switch
            id="use-saved"
            checked={useSavedProfile}
            onCheckedChange={setUseSavedProfile}
          />
          <Label htmlFor="use-saved">Use a saved profile</Label>
        </div>
      )}

      {useSavedProfile ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Profile</Label>
            <Select value={selectedSavedProfile || undefined} onValueChange={handleSavedProfileChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a saved profile" />
              </SelectTrigger>
              <SelectContent>
                {savedProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.profile_name} ({profile.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onAnalyze} disabled={!selectedSavedProfile || isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze with This Profile'
            )}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile_name">Profile Name *</Label>
            <Input
              id="profile_name"
              placeholder="e.g., My Marathon Training, My SaaS Startup"
              {...register('profile_name')}
            />
            {errors.profile_name && (
              <p className="text-sm text-destructive">{errors.profile_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={(value) => setValue('category', value as any)} defaultValue={category}>
              <SelectTrigger>
                <SelectValue placeholder="Select your domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="health_fitness">Health & Fitness</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="personal_development">Personal Development</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_description">Current Role *</Label>
            <Input
              id="role_description"
              placeholder="e.g., Founder, Runner, Doctor, Teacher"
              {...register('role_description')}
            />
            {errors.role_description && (
              <p className="text-sm text-destructive">{errors.role_description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience_level">Experience Level *</Label>
            <Select onValueChange={(value) => setValue('experience_level', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
            {errors.experience_level && (
              <p className="text-sm text-destructive">{errors.experience_level.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Goals *</Label>
            <Textarea
              id="goals"
              placeholder="What are you trying to achieve?"
              rows={3}
              {...register('goals')}
            />
            {errors.goals && (
              <p className="text-sm text-destructive">{errors.goals.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="challenges">Challenges *</Label>
            <Textarea
              id="challenges"
              placeholder="What obstacles are you facing?"
              rows={2}
              {...register('challenges')}
            />
            {errors.challenges && (
              <p className="text-sm text-destructive">{errors.challenges.message}</p>
            )}
          </div>

          {savedProfiles.length < (subscription?.profile_limit || 3) && (
            <div className="flex items-center space-x-2">
              <Switch
                id="save-profile"
                checked={saveAsProfile}
                onCheckedChange={setSaveAsProfile}
              />
              <Label htmlFor="save-profile">
                Save this profile for future use ({savedProfiles.length}/{subscription?.profile_limit || 3})
                {subscription?.tier === 'free' && savedProfiles.length >= 2 && (
                  <span className="text-primary ml-1">• Upgrade for 15 profiles</span>
                )}
              </Label>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isAnalyzing} className="flex-1">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Video'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onSkip} disabled={isAnalyzing}>
              Skip Profile
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContextProfileForm;