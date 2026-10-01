import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleSlashIcon,
  ClockAlertIcon,
  Undo2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  ANGEBOT_STATUS,
  AUFTRAG_STATUS,
  RECHNUNG_STATUS,
  VERTRAG_STATUS,
} from "@/buero/logik/texte";
import { cn } from "@/lib/utils";

// One status, spoken and coloured, with an icon so colour is never the only cue.
type Ton = "offen" | "laufend" | "fertig" | "warnung" | "aus" | "korrektur";

const TON: Record<Ton, { klasse: string; Icon: typeof CircleDotIcon }> = {
  offen: { klasse: "text-muted-foreground", Icon: CircleDashedIcon },
  laufend: { klasse: "text-primary", Icon: CircleDotIcon },
  fertig: { klasse: "text-success", Icon: CircleCheckIcon },
  warnung: { klasse: "text-warning", Icon: ClockAlertIcon },
  aus: { klasse: "text-muted-foreground line-through decoration-1", Icon: CircleSlashIcon },
  korrektur: { klasse: "text-muted-foreground", Icon: Undo2Icon },
};

function Chip({ ton, children }: { ton: Ton; children: string }) {
  const { klasse, Icon } = TON[ton];
  return (
    <Badge variant="outline" className={cn("gap-1.5", klasse)}>
      <Icon aria-hidden="true" /> {children}
    </Badge>
  );
}

export function AuftragStatus({ status }: { status: keyof typeof AUFTRAG_STATUS }) {
  const ton: Ton =
    status === "angebot"
      ? "offen"
      : status === "abgerechnet"
        ? "fertig"
        : status === "storniert"
          ? "aus"
          : "laufend";
  return <Chip ton={ton}>{AUFTRAG_STATUS[status].name}</Chip>;
}

export function VertragStatus({ status }: { status: keyof typeof VERTRAG_STATUS }) {
  const ton: Ton =
    status === "entwurf"
      ? "offen"
      : status === "aktiv"
        ? "laufend"
        : status === "gekuendigt"
          ? "warnung"
          : "aus";
  return <Chip ton={ton}>{VERTRAG_STATUS[status].name}</Chip>;
}

export function RechnungStatus({
  status,
  ueberfaellig = false,
  typ = "rechnung",
}: {
  status: keyof typeof RECHNUNG_STATUS;
  ueberfaellig?: boolean;
  typ?: "rechnung" | "storno";
}) {
  // A Storno is a correction, issued and done: nothing is owed on it.
  if (typ === "storno") return <Chip ton="korrektur">Korrektur</Chip>;
  if (status === "gestellt" && ueberfaellig) return <Chip ton="warnung">Überfällig</Chip>;
  const ton: Ton =
    status === "entwurf"
      ? "offen"
      : status === "gestellt"
        ? "laufend"
        : status === "bezahlt"
          ? "fertig"
          : "aus";
  return <Chip ton={ton}>{RECHNUNG_STATUS[status].name}</Chip>;
}

export function AngebotStatus({
  status,
  abgelaufen = false,
}: {
  status: keyof typeof ANGEBOT_STATUS;
  /** Sent and past its validity. */
  abgelaufen?: boolean;
}) {
  if (abgelaufen) return <Chip ton="warnung">Abgelaufen</Chip>;
  const ton: Ton =
    status === "entwurf"
      ? "offen"
      : status === "versendet"
        ? "laufend"
        : status === "angenommen"
          ? "fertig"
          : "aus";
  return <Chip ton={ton}>{ANGEBOT_STATUS[status].name}</Chip>;
}
