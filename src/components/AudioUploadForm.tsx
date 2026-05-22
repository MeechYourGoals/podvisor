import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, FileAudio, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnonymousAudioStorage } from '@/lib/anonymousAudioStorage';
import { Progress } from '@/components/ui/progress';
import { useProfileContext } from '@/contexts/ProfileContext';

interface AudioUploadFormProps {
  onAnalysisComplete: (audioId: string, isAnonymous: boolean) => void;
  subscription?: {
    tier: string;
    audio_uploads_this_month?: number;
    audio_per_month?: number;
    folders_per_profile?: number;
  } | null;
}

export const AudioUploadForm = ({ onAnalysisComplete, subscription }: AudioUploadFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeProfileId } = useProfileContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAnonymous = !user;
  const isPro = subscription?.tier === 'pro' || subscription?.tier === 'annual';
  const isFree = subscription?.tier === 'free';
  const anonymousAudioCount = isAnonymous ? AnonymousAudioStorage.count() : 0;
  const audioUsed = subscription?.audio_uploads_this_month || 0;
  const audioLimit = subscription?.audio_per_month || 2;
  const canUpload = isAnonymous
    ? AnonymousAudioStorage.canAddMore()
    : isPro || (isFree && audioUsed < audioLimit);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/aac'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'MP3, M4A, WAV, WebM, OGG, FLAC, AAC supported.', variant: 'destructive' });
      return;
    }
    if (file.size > 52428800) {
      toast({ title: 'File too large', description: 'Maximum size is 50MB.', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!canUpload) {
      if (isAnonymous) {
        toast({ title: 'Free trial used', description: 'Sign up to get 2 audio uploads / month.', variant: 'destructive' });
      } else if (isFree) {
        toast({ title: 'Monthly limit reached', description: `Free tier: ${audioLimit}/month. Upgrade for unlimited.`, variant: 'destructive' });
      } else {
        toast({ title: 'Pro required', description: 'Upgrade to upload audio.', variant: 'destructive' });
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      let storagePath = '';
      let audioBase64 = '';

      if (!isAnonymous && user) {
        const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
        const { data, error } = await supabase.storage.from('audio-uploads').upload(fileName, selectedFile);
        if (error) throw error;
        storagePath = data.path;
        setUploadProgress(30);
      } else {
        const reader = new FileReader();
        audioBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        setUploadProgress(30);
      }

      const { data: result, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          audioUpload: {
            filename: selectedFile.name,
            storagePath: storagePath || undefined,
            audioBase64: audioBase64 || undefined,
          },
          profileId: activeProfileId,
          isAnonymous,
        },
      });

      if (error) {
        if (error.message?.includes('402') || error.message?.includes('UPGRADE_REQUIRED'))
          throw new Error('Pro subscription required to upload audio.');
        throw error;
      }

      if (isAnonymous) {
        AnonymousAudioStorage.add({
          id: result.videoId,
          title: selectedFile.name,
          audio_filename: selectedFile.name,
          analyzed_at: new Date().toISOString(),
          insights: result.insights || [],
          personalized_insights: result.personalizedInsights || [],
        });
      }

      toast({ title: 'Audio analyzed', description: `${result.insightCount || 0} insights extracted.` });
      onAnalysisComplete(result.videoId, isAnonymous);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Audio upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Failed to analyze audio.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const quotaLabel = isAnonymous
    ? `${anonymousAudioCount}/1 free`
    : isFree
      ? `${audioUsed}/${audioLimit} this month`
      : isPro
        ? 'Unlimited'
        : 'Pro only';

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="audio-input" className="text-footnote font-medium flex items-center gap-1.5 text-muted-foreground cursor-pointer">
            <FileAudio className="h-3.5 w-3.5" />
            Or upload audio
          </label>
          <span className="text-caption text-muted-foreground">{quotaLabel}</span>
        </div>

        {!selectedFile ? (
          <label
            htmlFor="audio-input"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card-elevated text-footnote text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Choose audio file (MP3, M4A, WAV…)
            <input
              id="audio-input"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={isUploading || !canUpload}
              className="sr-only"
            />
          </label>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-card-elevated px-3 py-2.5">
            <FileAudio className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium truncate">{selectedFile.name}</p>
              <p className="text-caption text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="p-1 rounded-full hover:bg-accent text-muted-foreground"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isUploading && uploadProgress > 0 && (
          <div className="space-y-1">
            <Progress value={uploadProgress} />
            <p className="text-caption text-center text-muted-foreground">
              {uploadProgress < 30 ? 'Uploading…' : 'Analyzing with AI…'}
            </p>
          </div>
        )}

        {selectedFile && (
          <Button onClick={handleUpload} disabled={isUploading || !canUpload} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Analyze audio
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
