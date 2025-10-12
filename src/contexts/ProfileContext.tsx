import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  profile_name: string;
  category: string;
  role_description: string;
  experience_level: string;
  goals: string;
  challenges: string;
}

interface ProfileContextType {
  activeProfileId: string | null;
  setActiveProfileId: (id: string | null) => void;
  profiles: UserProfile[];
  loadProfiles: () => Promise<void>;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    // Load from localStorage on init
    return localStorage.getItem('activeProfileId');
  });
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const setActiveProfileId = (id: string | null) => {
    setActiveProfileIdState(id);
    if (id) {
      localStorage.setItem('activeProfileId', id);
    } else {
      localStorage.removeItem('activeProfileId');
    }
  };

  const loadProfiles = async () => {
    if (!user) {
      setProfiles([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_context_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);

      // Validate activeProfileId still exists
      if (activeProfileId && !data?.find(p => p.id === activeProfileId)) {
        setActiveProfileId(null);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfiles();
    } else {
      setProfiles([]);
      setActiveProfileId(null);
    }
  }, [user]);

  return (
    <ProfileContext.Provider
      value={{
        activeProfileId,
        setActiveProfileId,
        profiles,
        loadProfiles,
        isLoading,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};
