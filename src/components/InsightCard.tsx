import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bookmark, Copy, CheckCircle2, Lightbulb, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookmarkDialog } from './BookmarkDialog';

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

  const handleBookmark = () => {
    setBookmarkDialogOpen(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(insight.insight_text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Insight copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      strategy: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      execution: 'bg-green-500/10 text-green-500 border-green-500/20',
      mindset: 'bg-red-500/10 text-red-500 border-red-500/20',
      technical: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      nutrition: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      training: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isPersonalized ? 'border-l-4 border-l-green-500' : ''}`}>
      <CardContent className="pt-6 space-y-4">
        {/* Header: Index + Category + Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {index !== undefined && !isPersonalized && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">#{index + 1}</span>
              </div>
            )}
            {isPersonalized && (
              <Lightbulb className="h-5 w-5 text-green-500 flex-shrink-0" />
            )}
            <Badge variant="outline" className={getCategoryColor(insight.category)}>
              {insight.category}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBookmark}
              className="h-8 w-8 p-0"
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Profile Context (for personalized insights) */}
        {insight.for_profile_context && (
          <div className="text-sm font-medium text-green-600 dark:text-green-400">
            {insight.for_profile_context}
          </div>
        )}

        {/* Insight Text */}
        <p className="text-sm leading-relaxed text-foreground">
          {insight.insight_text}
        </p>

        {/* Expert Attribution */}
        {insight.expert_attribution && (
          <p className="text-sm italic text-muted-foreground">
            — {insight.expert_attribution}
          </p>
        )}

        {/* Scores as Pills */}
        <div className="flex gap-2 flex-wrap">
          {insight.impact_score !== undefined && (
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              Impact: {insight.impact_score}/10
            </Badge>
          )}
          {insight.actionability_score !== undefined && (
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              Actionability: {insight.actionability_score}/10
            </Badge>
          )}
        </div>

        {/* Action Items */}
        {actionItems && actionItems.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Action Items:
            </p>
            <ol className="space-y-2 list-decimal list-inside">
              {actionItems.map((item, idx) => (
                <li key={idx} className="text-sm leading-relaxed">
                  {item.replace(/^\d+\.\s*/, '')}
                </li>
              ))}
            </ol>
          </div>
        )}

        <BookmarkDialog
          open={bookmarkDialogOpen}
          onOpenChange={setBookmarkDialogOpen}
          insightId={insight.id}
          type="insight"
        />
      </CardContent>
    </Card>
  );
};

export default InsightCard;