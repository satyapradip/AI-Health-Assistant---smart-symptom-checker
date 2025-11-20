import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
          "flex min-h-[140px] w-full rounded-3xl border border-white/60 bg-white/75 px-5 py-4 text-base text-foreground/90 ring-offset-background shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-all duration-300 placeholder:text-foreground/55 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 dark:border-white/15 dark:bg-white/10 dark:focus-visible:bg-white/20",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
