import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play } from 'lucide-react';
import ContextProfileForm from './ContextProfileForm';

const videoSchema = z.object({
  videoUrl: z.string().url('Please enter a valid YouTube URL').includes('youtube.com', { message: 'Please enter a valid YouTube URL' }).or(z.string().includes('youtu.be', { message: 'Please enter a valid YouTube URL' })),
});

type VideoFormData = z.infer<typeof videoSchema>;

interface AnalysisFormProps {
  onAnalysisComplete: () => void;
}

const AnalysisForm = ({ onAnalysisComplete }: AnalysisFormProps) => {
  const [step, setStep] = useState<'video' | 'profile'>('video');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
  });

  const onVideoSubmit = (data: VideoFormData) => {
    setVideoUrl(data.videoUrl);
    setStep('profile');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl,
          profileId: selectedProfileId,
        },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Video analyzed! ${data.insightCount} insights extracted.`,
      });

      onAnalysisComplete();
      setStep('video');
      setVideoUrl('');
      setSelectedProfileId(null);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to analyze video',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkipProfile = () => {
    handleAnalyze();
  };

  if (step === 'video') {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Analyze a Video
          </CardTitle>
          <CardDescription>
            Paste any YouTube URL to extract expert insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onVideoSubmit)} className="space-y-4">
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Direct URL</TabsTrigger>
                <TabsTrigger value="channel">By Channel</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">YouTube Video URL</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    {...register('videoUrl')}
                  />
                  {errors.videoUrl && (
                    <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Works with any video featuring expert knowledge (interviews, tutorials, talks, etc.)
                  </p>
                </div>
                <Button type="submit" className="w-full">
                  Continue to Profile Setup
                </Button>
              </TabsContent>
              <TabsContent value="channel" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Coming soon: Browse popular channels by domain
                </p>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Step 2: Context Profile (Optional)</CardTitle>
        <CardDescription>
          Tell us about your goals to get personalized insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ContextProfileForm
          onProfileSelect={(profileId) => setSelectedProfileId(profileId)}
          onAnalyze={handleAnalyze}
          onSkip={handleSkipProfile}
          isAnalyzing={isAnalyzing}
        />
        <Button
          variant="outline"
          onClick={() => setStep('video')}
          className="mt-4 w-full"
          disabled={isAnalyzing}
        >
          Back to Video URL
        </Button>
      </CardContent>
    </Card>
  );
};

export default AnalysisForm;