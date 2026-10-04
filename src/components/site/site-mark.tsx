import { initialOf } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Placeholder mark: the site name's first letter on the primary colour. Header, phone menu, footer
 * and the admin show it until a project draws its own logo (then replace it here, and the icons).
 */
export function SiteMark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground",
        className,
      )}
    >
      {initialOf(name)}
    </span>
  );
}
