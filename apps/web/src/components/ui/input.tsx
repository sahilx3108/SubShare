import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)]",
          "border-[var(--border)] placeholder:text-[var(--text-muted)]",
          "focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/25",
          "transition-colors duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("field-label", className)} {...props} />;
}

