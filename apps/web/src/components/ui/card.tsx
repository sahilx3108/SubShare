import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-2xl shadow-card-dark transition-all duration-300",
        "hover:border-[var(--border-hover)] hover:shadow-glow-red",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-[var(--border)] px-6 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-[var(--text-primary)]", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}

type BadgeTone = "green" | "blue" | "gray" | "amber" | "red" | "brand";

const tones: Record<BadgeTone, string> = {
  green: "bg-emerald-950/60 text-emerald-400 ring-emerald-500/30",
  blue:  "bg-sky-950/60 text-sky-400 ring-sky-500/30",
  gray:  "bg-neutral-800/60 text-neutral-400 ring-neutral-600/30",
  amber: "bg-amber-950/60 text-amber-400 ring-amber-500/30",
  red:   "bg-red-950/60 text-red-400 ring-red-500/30",
  brand: "bg-brand-500/10 text-brand-400 ring-brand-500/30",
};

export function Badge({
  tone = "gray",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function statusBadgeTone(status: string): BadgeTone {
  switch (status) {
    case "AVAILABLE":
      return "green";
    case "ACTIVE":
      return "brand";
    case "EXPIRED":
      return "gray";
    default:
      return "amber";
  }
}

