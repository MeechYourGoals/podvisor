import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bookmark, Copy, CheckCircle2, Lightbulb, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookmarkDialog } from './BookmarkDialog';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: {
    id: string;
    insight_text: string;
    category: string;
    impact_score: number;
    actionability_score: number;
    expert_attribution?: string;
    for_profile_context?: string;
  };
  onBookmark: (insightId: string) => void;
  isBookmarked?: boolean;
  actionItems?: string[];
  index?: number;
  isPersonalized?: boolean;
}

const InsightCard = ({ insight, onBookmark, isBookmarked, actionItems, index, isPersonalized }: InsightCardProps) => {
  const [copied, setCopied] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(insight.insight_text);
    setCopied(true);
    toast({ title: 'Copied', description: 'Insight copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className={cn(
        'transition-colors',
        isPersonalized && 'border-l-2 border-l-primary',
      )}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {index !== undefined && !isPersonalized && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                {index + 1}
              </span>
            )}
            {isPersonalized && <Lightbulb className="h-4 w-4 text-primary shrink-0" />}
            <Badge variant="outline" className="text-[11px] uppercase tracking-wide font-medium border-border text-muted-foreground">
              {insight.category}
            </Badge>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" onClick={handleCopy} className="h-8 w-8" aria-label="Copy">
              {copied ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setBookmarkDialogOpen(true)} className="h-8 w-8" aria-label="Bookmark">
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current text-primary')} />
            </Button>
          </div>
        </div>

        {insight.for_profile_context && (
          <p className="text-caption font-medium text-primary">{insight.for_profile_context}</p>
        )}

        <p className="text-[15px] leading-relaxed text-foreground">{insight.insight_text}</p>

        {insight.expert_attribution && (
          <p className="text-footnote italic text-muted-foreground">— {insight.expert_attribution}</p>
        )}

        {/* Scores */}
        <div className="flex gap-3 pt-1 text-caption text-muted-foreground">
          {insight.impact_score !== undefined && (
            <span><span className="font-medium text-foreground/70">Impact</span> · {insight.impact_score}/10</span>
          )}
          {insight.actionability_score !== undefined && (
            <span><span className="font-medium text-foreground/70">Action</span> · {insight.actionability_score}/10</span>
          )}
        </div>

        {actionItems && actionItems.length > 0 && (
          <div className="pt-3 border-t border-border space-y-1.5">
            <p className="text-caption font-semibold text-primary flex items-center gap-1.5">
              <Check className="h-3 w-3" />
              Action items
            </p>
            <ol className="space-y-1 list-decimal list-inside text-[14px]">
              {actionItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item.replace(/^\d+\.\s*/, '')}</li>
              ))}
            </ol>
          </div>
        )}

        <BookmarkDialog open={bookmarkDialogOpen} onOpenChange={setBookmarkDialogOpen} insightId={insight.id} type="insight" />
      </CardContent>
    </Card>
  );
};

export default InsightCard;
