import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, ChevronDown, Sparkles } from 'lucide-react';
import { ProfileQuickSwitcher } from './ProfileQuickSwitcher';
import { useProfileContext } from '@/contexts/ProfileContext';

const videoSchema = z.object({
  videoUrl: z.string().url('Please enter a valid YouTube URL').includes('youtube.com', { message: 'Please enter a valid YouTube URL' }).or(z.string().includes('youtu.be', { message: 'Please enter a valid YouTube URL' })),
});

type VideoFormData = z.infer<typeof videoSchema>;

interface AnalysisFormProps {
  onAnalysisComplete: () => void;
}

const AnalysisForm = ({ onAnalysisComplete }: AnalysisFormProps) => {
  const { activeProfileId } = useProfileContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
  });

  const useSampleLink = () => {
    setValue('videoUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  };

  const handleAnalyze = async (data: VideoFormData) => {
    setIsAnalyzing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl: data.videoUrl,
          profileId: activeProfileId,
        },
      });

      if (error) {
        if (error.message?.includes('402') || error.message?.includes('Payment')) {
          throw new Error('Payment required. Please upgrade your plan.');
        }
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw error;
      }

      // Handle error codes from edge function
      if (result?.error_code) {
        const errorMessages: Record<string, string> = {
          'AI_NO_CHOICES': "The AI didn't return structured insights. Please try again or another video.",
          'AI_NO_TOOL_CALL': "The AI didn't return structured insights. Please try again or another video.",
          'AI_INVALID_STRUCTURE': "The AI returned incomplete data. Please try again.",
          'TRANSCRIPT_UNAVAILABLE': "No transcript found; using limited metadata. Results may be lighter.",
          'AI_GATEWAY_ERROR': result.error || 'AI processing error occurred.',
          'RATE_LIMIT': 'Rate limit exceeded. Please try again later.',
          'PAYMENT_REQUIRED': 'Payment required. Please upgrade your plan.',
        };
        
        const message = errorMessages[result.error_code] || result.error || 'An error occurred during analysis.';
        throw new Error(message);
      }

      // Success with possible warnings
      let successMessage = `Video analyzed! ${result.insightCount || 0} insights extracted.`;
      
      if (result.transcriptSource === 'perplexity') {
        successMessage += ' (AI analysis method)';
      } else if (result.transcriptSource === 'metadata-only') {
        successMessage += ' (Limited - metadata only)';
      }
      
      toast({
        title: "Success!",
        description: successMessage,
      });
      
      // Show warnings if any
      if (result?.warnings && Array.isArray(result.warnings)) {
        result.warnings.forEach((warning: string) => {
          toast({
            title: "Note",
            description: warning,
            variant: "default",
          });
        });
      }

      onAnalysisComplete();
      reset();
      setIsAdvancedOpen(false);
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
        <form onSubmit={handleSubmit(handleAnalyze)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="videoUrl">YouTube Video URL</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useSampleLink}
                disabled={isAnalyzing}
                className="h-auto py-1 text-xs"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Use sample
              </Button>
            </div>
            <Input
              id="videoUrl"
              type="url"
              placeholder="YouTube URL..."
              {...register('videoUrl')}
              disabled={isAnalyzing}
            />
            {errors.videoUrl && (
              <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
            )}
          </div>

          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <span className="text-sm">Advanced: Filter through a profile</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <ProfileQuickSwitcher />
            </CollapsibleContent>
          </Collapsible>

          <Button type="submit" className="w-full" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Analyze Video
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {activeProfileId ? 'Analyzing with selected profile' : 'Analyzing with your default profile'}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default AnalysisForm;