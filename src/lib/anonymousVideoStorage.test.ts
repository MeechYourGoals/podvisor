import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnonymousVideoStorage } from './anonymousVideoStorage';

describe('AnonymousVideoStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should add and retrieve video data', () => {
    const videoData = {
      id: 'test-id',
      youtube_url: 'https://youtube.com/watch?v=test',
      title: 'Test Video',
      video_id: 'test123',
      analyzed_at: new Date().toISOString(),
      insights: [],
      personalized_insights: [],
      speakers: [],
      tags: [],
      profile_used: null,
    };

    AnonymousVideoStorage.add(videoData);
    const videos = AnonymousVideoStorage.getAll();

    expect(videos).toHaveLength(1);
    expect(videos[0].youtube_url).toBe(videoData.youtube_url);
  });

  it('should limit storage to 3 videos maximum', () => {
    for (let i = 0; i < 5; i++) {
      AnonymousVideoStorage.add({
        id: `test-id-${i}`,
        youtube_url: `https://youtube.com/watch?v=test${i}`,
        title: `Test Video ${i}`,
        video_id: `test${i}`,
        analyzed_at: new Date().toISOString(),
        insights: [],
        personalized_insights: [],
        speakers: [],
        tags: [],
        profile_used: null,
      });
    }

    const videos = AnonymousVideoStorage.getAll();
    expect(videos).toHaveLength(3);
  });

  it('should clear all videos', () => {
    AnonymousVideoStorage.add({
      id: 'test-id',
      youtube_url: 'https://youtube.com/watch?v=test',
      title: 'Test Video',
      video_id: 'test123',
      analyzed_at: new Date().toISOString(),
      insights: [],
      personalized_insights: [],
      speakers: [],
      tags: [],
      profile_used: null,
    });

    AnonymousVideoStorage.clear();
    const videos = AnonymousVideoStorage.getAll();

    expect(videos).toHaveLength(0);
  });

  it('should get videos for migration', () => {
    AnonymousVideoStorage.add({
      id: 'test-id',
      youtube_url: 'https://youtube.com/watch?v=test',
      title: 'Test Video',
      video_id: 'test123',
      analyzed_at: new Date().toISOString(),
      insights: [],
      personalized_insights: [],
      speakers: [],
      tags: [],
      profile_used: null,
    });

    const videos = AnonymousVideoStorage.getForMigration();
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveProperty('youtube_url');
    expect(videos[0]).toHaveProperty('insights');
  });
});
