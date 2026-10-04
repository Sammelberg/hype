"use client";

import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { speichereNotizAction } from "../../../../_actions/buchung";

// The note the performer reads before the party: „dog in the yard“, „door code 1234“.
export function NotizEditor({ id, notiz }: { id: number; notiz: string | null }) {
  const router = useRouter();
  const [text, setText] = useState(notiz ?? "");
  const [busy, setBusy] = useState(false);
  const geaendert = text !== (notiz ?? "");

  const speichern = async () => {
    setBusy(true);
    const result = await speichereNotizAction({ id, notiz: text || null });
    setBusy(false);
    if (result?.serverError) return void toast.error(result.serverError.message);
    toast.success("Notiz gespeichert.");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="notiz-intern">Für den Darsteller</FieldLabel>
        <Textarea
          id="notiz-intern"
          value={text}
          rows={4}
          maxLength={5000}
          onChange={(e) => setText(e.target.value)}
        />
        <FieldDescription>Nur intern. Hund im Hof, Türcode, Parken.</FieldDescription>
      </Field>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        disabled={busy || !geaendert}
        onClick={speichern}
      >
        {busy ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
        Notiz speichern
      </Button>
    </div>
  );
}
