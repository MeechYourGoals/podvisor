import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bookmark, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface InsightCardProps {
  insight: {
    id: string;
    insight_text: string;
    category: string;
    impact_score: number;
    actionability_score: number;
  };
  onBookmark: (insightId: string) => void;
  isBookmarked?: boolean;
  actionItems?: string[];
}

const InsightCard = ({ insight, onBookmark, isBookmarked, actionItems }: InsightCardProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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
      mindset: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      technical: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      nutrition: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      training: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={getCategoryColor(insight.category)}>
            {insight.category}
          </Badge>
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
              onClick={() => onBookmark(insight.id)}
              className="h-8 w-8 p-0"
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground">
          {insight.insight_text}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Impact</span>
              <span className="font-medium">{insight.impact_score}/10</span>
            </div>
            <Progress value={insight.impact_score * 10} className="h-1.5" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Actionability</span>
              <span className="font-medium">{insight.actionability_score}/10</span>
            </div>
            <Progress value={insight.actionability_score * 10} className="h-1.5" />
          </div>
        </div>

        {actionItems && actionItems.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Action Items:</p>
            <ul className="space-y-1.5">
              {actionItems.map((item, index) => (
                <li key={index} className="text-xs flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightCard;