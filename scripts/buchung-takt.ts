// `pnpm cms:buchung-takt` — the booking engine's beat, from cron on the server every five minutes
// (deploy/aufgabe.sh buchung-takt): holds whose time ran out lapse, their Darsteller are free again
// (the website already counts a lapsed hold as free; this makes it so in the admin too), and the
// reminders that are due go out — a week ahead, the day before, the day after — each once.
import { gebeAbgelaufeneFrei } from "../src/buchung/daten/belegung";
import { sendeFaelligeErinnerungen } from "../src/buchung/post/senden";

const jetzt = new Date();
const verfallen = await gebeAbgelaufeneFrei(jetzt);
const erinnert = await sendeFaelligeErinnerungen(jetzt);

console.log(
  `Buchung-Takt ${jetzt.toISOString()}: ${verfallen.length} Reservierung(en) verfallen, ${erinnert} Erinnerung(en) gesendet.`,
);
process.exit(0);
