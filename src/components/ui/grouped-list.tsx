import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * iOS-style grouped list primitive.
 *
 * Usage:
 *   <GroupedList header="Account">
 *     <GroupedListRow icon={User} label="Profile" value="Maya" onClick={...} />
 *     <GroupedListRow icon={Bell} label="Notifications" />
 *   </GroupedList>
 */

interface GroupedListProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const GroupedList = React.forwardRef<HTMLDivElement, GroupedListProps>(
  ({ header, footer, className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {header && <div className="ios-section-header">{header}</div>}
      <div className="surface overflow-hidden divide-y divide-border">{children}</div>
      {footer && <p className="px-4 pt-2 text-caption text-muted-foreground">{footer}</p>}
    </div>
  ),
);
GroupedList.displayName = "GroupedList";

interface GroupedListRowProps {
  icon?: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  label: React.ReactNode;
  value?: React.ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  className?: string;
  trailing?: React.ReactNode;
  href?: string;
}

export const GroupedListRow = ({
  icon: Icon,
  iconBg,
  label,
  value,
  chevron = false,
  destructive = false,
  onClick,
  className,
  trailing,
  href,
}: GroupedListRowProps) => {
  const inner = (
    <>
      {Icon && (
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            iconBg ?? "bg-muted",
          )}
        >
          <Icon className={cn("h-4 w-4", destructive ? "text-destructive" : "text-foreground")} />
        </span>
      )}
      <span className={cn("flex-1 text-[15px] font-medium", destructive && "text-destructive")}>{label}</span>
      {value !== undefined && <span className="text-[15px] text-muted-foreground truncate max-w-[55%]">{value}</span>}
      {trailing}
      {chevron && <ChevronRight className="h-4 w-4 text-muted-foreground/60" />}
    </>
  );

  const baseClass = cn(
    "flex items-center gap-3 px-4 py-3 min-h-[44px] transition-colors",
    (onClick || href) && "hover:bg-accent active:bg-accent/70 cursor-pointer",
    className,
  );

  if (href) {
    return (
      <a href={href} className={baseClass} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(baseClass, "w-full text-left")}>
      {inner}
    </button>
  );
};
