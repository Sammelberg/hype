// `pnpm cms:geplant`: publishes the pages and projects whose scheduled time has come. The
// server's timer runs it every few minutes (README → „Эксплуатация на сервере“). It asks the
// running app (/next/geplant), because publishing must also rebuild the static pages.
const url = process.env.NEXT_PUBLIC_SERVER_URL;
const secret = process.env.CRON_SECRET;
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SERVER_URL und CRON_SECRET müssen gesetzt sein.");
  process.exit(1);
}

const response = await fetch(new URL("/next/geplant", url), {
  method: "POST",
  headers: { authorization: `Bearer ${secret}` },
});
if (!response.ok) {
  console.error(`Geplante Veröffentlichung: ${response.status} ${await response.text()}`);
  process.exit(1);
}
const { veroeffentlicht, fehler } = (await response.json()) as {
  veroeffentlicht: { art: string; pfad: string }[];
  fehler: { art: string; id: number; meldung: string }[];
};
for (const v of veroeffentlicht) console.log(`Veröffentlicht: ${v.pfad}`);
for (const f of fehler) console.error(`Nicht veröffentlicht (${f.art} ${f.id}): ${f.meldung}`);
if (fehler.length > 0) process.exit(1);

export {};
