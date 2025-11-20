import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-white/60 bg-white/70 px-5 text-base text-foreground/90 ring-offset-background shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-300 placeholder:text-foreground/55 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 dark:border-white/15 dark:bg-white/10 dark:focus-visible:bg-white/20",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
