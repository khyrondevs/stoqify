import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 select-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-cobalt-600 text-white',
        secondary: 'border-warm-200 bg-warm-100 text-slate-800',
        outline: 'border-warm-300 text-slate-700 bg-white',
        success: 'border-teal-200 bg-teal-50 text-teal-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
        destructive: 'border-red-200 bg-red-50 text-red-800',
        inStock: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        lowStock: 'border-amber-300 bg-amber-50 text-amber-900',
        critical: 'border-rose-300 bg-rose-50 text-rose-900',
        outOfStock: 'border-slate-300 bg-slate-100 text-slate-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
