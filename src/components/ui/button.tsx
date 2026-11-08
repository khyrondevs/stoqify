import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cobalt-600 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default: 'bg-cobalt-600 text-white shadow-sm hover:bg-cobalt-700 active:bg-cobalt-800',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
        outline: 'border border-warm-300 bg-white text-slate-800 shadow-sm hover:bg-warm-100 hover:border-warm-400 active:bg-warm-200',
        secondary: 'bg-warm-100 text-slate-800 hover:bg-warm-200 active:bg-warm-300',
        ghost: 'text-slate-700 hover:bg-warm-100 hover:text-slate-900',
        link: 'text-cobalt-600 underline-offset-4 hover:underline',
        teal: 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:bg-teal-800',
      },
      size: {
        default: 'h-8 px-3 py-1.5',
        xs: 'h-6 rounded px-2 text-[11px]',
        sm: 'h-7 rounded-md px-2.5 text-xs',
        lg: 'h-9 rounded-md px-4 text-sm',
        icon: 'h-8 w-8',
        iconSm: 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
