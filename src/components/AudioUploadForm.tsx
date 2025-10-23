import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Crown, Loader2, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
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
  const anonymousAudioCount = isAnonymous ? AnonymousAudioStorage.count() : 0;
  const isFree = subscription?.tier === 'free';
  const audioUsed = subscription?.audio_uploads_this_month || 0;
  const audioLimit = subscription?.audio_per_month || 2;
  const canUpload = isAnonymous ? AnonymousAudioStorage.canAddMore() : (isPro || (isFree && audioUsed < audioLimit));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/aac'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an audio file (MP3, M4A, WAV, WebM, OGG, FLAC, AAC)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (50MB)
    if (file.size > 52428800) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Check eligibility
    if (!canUpload) {
      if (isAnonymous) {
        toast({
          title: 'Free trial used',
          description: 'Sign up to get 2 audio uploads/month',
          variant: 'destructive',
        });
      } else if (isFree) {
        toast({
          title: 'Monthly limit reached',
          description: `Free tier: ${audioLimit} audio uploads/month. Upgrade to Pro for unlimited!`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Pro subscription required',
          description: 'Upgrade to Pro to upload audio files',
          variant: 'destructive',
        });
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      let storagePath = '';
      let audioBase64 = '';
      
      if (!isAnonymous && user) {
        // Upload to Supabase Storage for authenticated Pro users
        const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
        const { data, error } = await supabase.storage
          .from('audio-uploads')
          .upload(fileName, selectedFile);

        if (error) throw error;
        storagePath = data.path;
        setUploadProgress(30);
      } else {
        // Convert to base64 for anonymous users
        const reader = new FileReader();
        audioBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        setUploadProgress(30);
      }

      // Call analyze-video function with audio upload
      const { data: result, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          audioUpload: {
            filename: selectedFile.name,
            storagePath: storagePath || undefined,
            audioBase64: audioBase64 || undefined,
          },
          profileId: activeProfileId,
          isAnonymous: isAnonymous,
        },
      });

      if (error) {
        if (error.message?.includes('402') || error.message?.includes('UPGRADE_REQUIRED')) {
          throw new Error('💎 Pro subscription required to upload audio files');
        }
        throw error;
      }

      // Handle success
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

      toast({
        title: 'Audio analyzed!',
        description: `${result.insightCount || 0} insights extracted from your audio`,
      });

      onAnalysisComplete(result.videoId, isAnonymous);
      setSelectedFile(null);
      setUploadProgress(0);

    } catch (error: any) {
      console.error('Audio upload error:', error);
      
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to analyze audio',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="mb-8 border-2 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-center space-y-1 mb-2">
              <div className="text-2xl font-semibold">YAYA</div>
              <div className="text-base font-normal text-muted-foreground">Your Audio, Your Advice</div>
            </CardTitle>
            <CardDescription className="text-center">
              {isPro
                ? 'Upload podcasts, meetings, lectures - any audio content'
                : isAnonymous
                  ? 'Upload podcasts, meetings, lectures - any audio content'
                  : isFree
                    ? `${audioUsed}/${audioLimit} uploads used this month`
                    : 'Upgrade to Pro to analyze audio files'}
              {!isAnonymous && !isPro && !isFree && (
                <Badge variant="secondary" className="ml-2">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              )}
            </CardDescription>
          </div>
          {isAnonymous && (
            <Badge variant="secondary" className="text-xs absolute top-6 right-6">
              {anonymousAudioCount}/1 free
            </Badge>
          )}
          {!isAnonymous && isFree && (
            <Badge variant="secondary" className="text-xs absolute top-6 right-6">
              {audioUsed}/{audioLimit} used
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isUploading || !canUpload}
            className="cursor-pointer"
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
            </p>
          )}
        </div>

        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-xs text-center text-muted-foreground">
              {uploadProgress < 30 ? 'Uploading...' : 'Analyzing with AI...'}
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || !canUpload}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Analyze Audio
            </>
          )}
        </Button>

        {!isAnonymous && !isPro && (
          <p className="text-xs text-center text-muted-foreground">
            Requires Pro subscription • Scroll down to upgrade
          </p>
        )}
      </CardContent>
    </Card>
  );
};
