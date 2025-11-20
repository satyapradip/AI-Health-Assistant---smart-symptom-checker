import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium tracking-tight ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-primary/90 to-secondary text-primary-foreground shadow-[0_18px_55px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 before:pointer-events-none before:absolute before:-z-10 before:inset-px before:rounded-2xl before:bg-white/20 before:opacity-40 before:content-['']",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_15px_40px_rgba(124,45,45,0.35)] hover:-translate-y-0.5",
        outline:
          "border border-white/70 bg-white/60 text-foreground/80 backdrop-blur-xl hover:border-white hover:bg-white/80 hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/5 dark:text-foreground",
        secondary:
          "bg-gradient-to-r from-secondary/90 to-primary/85 text-secondary-foreground shadow-[0_18px_45px_rgba(10,35,62,0.22)] hover:-translate-y-0.5",
        ghost: "text-foreground/70 hover:text-foreground bg-transparent hover:bg-white/40 dark:hover:bg-white/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
