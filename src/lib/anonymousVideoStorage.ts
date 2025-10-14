interface AnonymousVideo {
  id: string;
  title: string;
  youtube_url: string;
  video_id: string;
  analyzed_at: string;
  insights: any[];
  personalized_insights: any[];
  speakers: any[];
  tags: string[];
  profile_used: string | null;
  thumbnail_url?: string;
  insightCount?: number;
  personalizedCount?: number;
}

const STORAGE_KEY = 'podvisor_anonymous_videos';
const PROFILE_STORAGE_KEY = 'podvisor_anonymous_profile';
const MAX_ANONYMOUS_VIDEOS = 3;

export const AnonymousVideoStorage = {
  getAll: (): AnonymousVideo[] => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const videos = JSON.parse(stored);
      return Array.isArray(videos) ? videos : [];
    } catch (error) {
      console.error('Error reading anonymous videos:', error);
      return [];
    }
  },

  add: (video: AnonymousVideo): boolean => {
    try {
      const videos = AnonymousVideoStorage.getAll();
      if (videos.length >= MAX_ANONYMOUS_VIDEOS) {
        return false;
      }
      videos.push(video);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
      return true;
    } catch (error) {
      console.error('Error adding anonymous video:', error);
      return false;
    }
  },

  count: (): number => {
    return AnonymousVideoStorage.getAll().length;
  },

  canAddMore: (): boolean => {
    return AnonymousVideoStorage.count() < MAX_ANONYMOUS_VIDEOS;
  },

  clear: (): void => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing anonymous videos:', error);
    }
  },

  getForMigration: (): AnonymousVideo[] => {
    return AnonymousVideoStorage.getAll();
  },

  getRemaining: (): number => {
    return MAX_ANONYMOUS_VIDEOS - AnonymousVideoStorage.count();
  },

  getAnonymousProfile: (): string | null => {
    try {
      return sessionStorage.getItem(PROFILE_STORAGE_KEY);
    } catch (error) {
      console.error('Error reading anonymous profile:', error);
      return null;
    }
  },

  setAnonymousProfile: (profile: string): void => {
    try {
      sessionStorage.setItem(PROFILE_STORAGE_KEY, profile);
    } catch (error) {
      console.error('Error saving anonymous profile:', error);
    }
  },

  clearAnonymousProfile: (): void => {
    try {
      sessionStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing anonymous profile:', error);
    }
  }
};
