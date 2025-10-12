import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AnonymousVideoStorage } from '@/lib/anonymousVideoStorage';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const migrateAnonymousVideos = async (userId: string) => {
    const videos = AnonymousVideoStorage.getForMigration();
    if (videos.length === 0) return;

    console.log('[useAuth] Migrating', videos.length, 'anonymous videos');

    try {
      for (const video of videos) {
        await supabase.functions.invoke('analyze-video', {
          body: {
            videoUrl: video.youtube_url,
            migrateData: true,
            cachedData: {
              insights: video.insights,
              personalizedInsights: video.personalized_insights,
              videoMetadata: {
                title: video.title,
                video_id: video.video_id,
                speakers: video.speakers,
                tags: video.tags,
                thumbnail_url: video.thumbnail_url,
              }
            }
          }
        });
      }

      AnonymousVideoStorage.clear();
      
      toast({
        title: "Welcome! 🎉",
        description: `Your ${videos.length} ${videos.length === 1 ? 'analysis has' : 'analyses have'} been saved to your account`,
      });
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Account created!",
        description: "Note: Previous analyses couldn't be transferred. You can re-analyze videos anytime.",
        variant: "default",
      });
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      // Migrate anonymous videos if signup successful
      if (data.user) {
        await migrateAnonymousVideos(data.user.id);
      }

      toast({
        title: "Success!",
        description: "Your account has been created. You can now sign in.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      navigate('/');
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });

      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
};