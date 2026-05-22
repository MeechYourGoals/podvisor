import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
    {Icon && (
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
      </div>
    )}
    <h3 className="text-title-3 mb-1.5">{title}</h3>
    {description && (
      <p className="text-footnote text-muted-foreground max-w-sm">{description}</p>
    )}
    {action && (
      <Button onClick={action.onClick} className="mt-6">
        {action.label}
      </Button>
    )}
  </div>
);
