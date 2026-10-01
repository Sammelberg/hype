"use client";

import { CalendarClockIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";

const zeit = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** „2026-10-02T08:00“ in the browser's zone, as datetime-local wants it. */
const lokal = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return z.toISOString().slice(0, 16);
};

// Publishing later: a moment in the browser's time; the server's timer publishes the draft then.
// Planned, the button names the moment and offers to cancel.
export function PlanenKnopf({
  geplant,
  disabled,
  onPlanen,
}: {
  geplant: Date | null;
  disabled?: boolean;
  /** Saves the plan (null cancels); true when it worked. */
  onPlanen: (at: Date | null) => Promise<boolean>;
}) {
  const [auf, setAuf] = useState(false);
  const [wert, setWert] = useState("");
  const [busy, setBusy] = useState(false);

  const oeffnen = (o: boolean) => {
    setAuf(o);
    if (o) {
      const morgen = new Date();
      morgen.setDate(morgen.getDate() + 1);
      morgen.setHours(8, 0, 0, 0);
      setWert(lokal(geplant ?? morgen));
    }
  };

  const senden = async (at: Date | null) => {
    setBusy(true);
    const ok = await onPlanen(at);
    setBusy(false);
    if (ok) setAuf(false);
  };

  return (
    <Popover open={auf} onOpenChange={oeffnen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={geplant ? "secondary" : "ghost"}
          size="sm"
          disabled={disabled}
        >
          <CalendarClockIcon data-icon="inline-start" />
          {geplant ? `Geplant: ${zeit.format(geplant)}` : "Planen"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="planen-am">Veröffentlichen am</FieldLabel>
            <Input
              id="planen-am"
              type="datetime-local"
              value={wert}
              min={lokal(new Date())}
              onChange={(e) => setWert(e.target.value)}
            />
            <FieldDescription>
              Dann geht der Entwurf online, wie er in diesem Moment ist. Bis dahin können Sie weiter
              daran arbeiten.
            </FieldDescription>
          </Field>
          <div className="flex justify-between gap-2">
            {geplant ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void senden(null)}
              >
                <XIcon data-icon="inline-start" /> Plan aufheben
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              size="sm"
              disabled={busy || !wert}
              onClick={() => void senden(new Date(wert))}
            >
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Planen
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
