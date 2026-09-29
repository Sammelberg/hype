import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="flex max-w-md flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Diese Seite gibt es nicht</h1>
        <p className="text-muted-foreground">
          Der Link ist veraltet oder die Seite wurde entfernt.
        </p>
        <Button asChild className="mx-auto">
          <Link href={"/admin" as never}>Zur Übersicht</Link>
        </Button>
      </div>
    </main>
  );
}
