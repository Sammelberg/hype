import { CircleDashedIcon, CircleDotIcon, CircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DocStatus } from "@/cms/content/types";

// One status per document, spoken and coloured: published, published with unpublished
// changes, or a draft. A dot beside the word, so colour is never the only cue.
export function StatusBadge({ status, hasDraft }: { status: DocStatus; hasDraft: boolean }) {
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
