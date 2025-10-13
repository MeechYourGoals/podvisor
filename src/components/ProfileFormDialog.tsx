import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  profile_name: z.string()
    .min(1, 'Profile name is required')
    .max(100, 'Profile name must be less than 100 characters'),
  category: z.enum(['business', 'sports', 'health_fitness', 'technology', 'personal_development', 'finance', 'entertainment', 'education', 'general']),
  role_description: z.string()
    .min(1, 'Current role is required')
    .max(200, 'Role description must be less than 200 characters'),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  goals: z.string()
    .min(10, 'Please describe your goals (at least 10 characters)')
    .max(1000, 'Goals must be less than 1000 characters'),
  challenges: z.string()
    .min(1, 'Please describe your challenges')
    .max(1000, 'Challenges must be less than 1000 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: any;
  onSuccess: () => void;
}

export const ProfileFormDialog = ({ open, onOpenChange, profile, onSuccess }: ProfileFormDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      setValue('profile_name', profile.profile_name);
      setValue('category', profile.category);
      setValue('role_description', profile.role_description);
      setValue('experience_level', profile.experience_level);
      setValue('goals', profile.goals);
      setValue('challenges', profile.challenges);
    } else {
      reset();
    }
  }, [profile, setValue, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_context_profiles')
          .update(data)
          .eq('id', profile.id);

        if (error) throw error;

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
      } else {
        // Create new profile
        const { error } = await supabase
          .from('user_context_profiles')
          .insert([{
            user_id: user.id,
            profile_name: data.profile_name,
            category: data.category,
            role_description: data.role_description,
            experience_level: data.experience_level,
            goals: data.goals,
            challenges: data.challenges,
          }]);

        if (error) throw error;

        toast({
          title: "Profile created",
          description: "Your new profile has been created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{profile ? 'Edit Profile' : 'Create New Profile'}</DialogTitle>
          <DialogDescription>
            {profile ? 'Update your context profile details' : 'Create a context profile to get personalized insights'}
          </DialogDescription>
        </DialogHeader>

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
            <Select onValueChange={(value) => setValue('category', value as any)}>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                profile ? 'Update Profile' : 'Create Profile'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};