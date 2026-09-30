"use client";

import { PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DruckenKnopf() {
  return (
    <Button type="button" size="sm" onClick={() => window.print()}>
      <PrinterIcon data-icon="inline-start" /> Drucken
    </Button>
  );
}
