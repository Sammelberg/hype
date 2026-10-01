import { CalendarClockIcon, CircleDashedIcon, CircleDotIcon, CircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DocStatus } from "@/cms/content/types";

const geplantAm = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// One status per document, spoken and coloured: scheduled, published, published with
// unpublished changes, or a draft. An icon beside the word, so colour is never the only cue.
export function StatusBadge({
  status,
  hasDraft,
  publishAt = null,
}: {
  status: DocStatus;
  hasDraft: boolean;
  publishAt?: Date | null;
}) {
  if (publishAt) {
    return (
      <Badge variant="outline" className="gap-1.5 text-primary-soft">
        <CalendarClockIcon aria-hidden="true" /> Geplant {geplantAm.format(publishAt)}
      </Badge>
    );
  }
  if (status === "published" && hasDraft) {
    return (
      <Badge variant="outline" className="text-warning gap-1.5">
        <CircleDotIcon aria-hidden="true" /> Änderungen
      </Badge>
    );
  }
  if (status === "published") {
    return (
      <Badge variant="outline" className="text-success gap-1.5">
        <CircleIcon aria-hidden="true" /> Veröffentlicht
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <CircleDashedIcon aria-hidden="true" /> Entwurf
    </Badge>
  );
}
