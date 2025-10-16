import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const AnimatedBorderCard = React.forwardRef<HTMLDivElement, AnimatedBorderCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative group", className)} {...props}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur opacity-75 group-hover:opacity-100 animate-gradient-x"></div>
        <div className="relative">
          {children}
        </div>
      </div>
    );
  }
);
AnimatedBorderCard.displayName = "AnimatedBorderCard";

export { AnimatedBorderCard };
