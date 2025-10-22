// Similar to anonymousVideoStorage but for audio uploads
const STORAGE_KEY = 'yaya_anonymous_audio_uploads';
const MAX_ANONYMOUS_AUDIO_UPLOADS = 1;

interface AnonymousAudio {
  id: string;
  title: string;
  audio_filename: string;
  analyzed_at: string;
  insights: any[];
  personalized_insights: any[];
  profile_used?: string;
}

export const AnonymousAudioStorage = {
  getAll: (): AnonymousAudio[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading anonymous audio uploads:', error);
      return [];
    }
  },

  add: (audio: AnonymousAudio): void => {
    try {
      const existing = AnonymousAudioStorage.getAll();
      const updated = [...existing, audio];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving anonymous audio upload:', error);
    }
  },

  count: (): number => {
    return AnonymousAudioStorage.getAll().length;
  },

  canAddMore: (): boolean => {
    return AnonymousAudioStorage.count() < MAX_ANONYMOUS_AUDIO_UPLOADS;
  },

  getRemaining: (): number => {
    return Math.max(0, MAX_ANONYMOUS_AUDIO_UPLOADS - AnonymousAudioStorage.count());
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  remove: (audioId: string): void => {
    try {
      const existing = AnonymousAudioStorage.getAll();
      const updated = existing.filter(a => a.id !== audioId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing anonymous audio upload:', error);
    }
  },
};
