// `pnpm cms:buchung-takt` — the booking engine's beat, from cron on the server every five minutes
// (deploy/aufgabe.sh buchung-takt): holds whose time ran out lapse, their Darsteller are free again
// (the website already counts a lapsed hold as free; this makes it so in the admin too), and the
// reminders that are due go out — a week ahead, the day before — each once, and bookings that
// never came about are deleted six months on.
import { loescheNichtZustandegekommene } from "../src/buchung/daten/aufbewahrung";
import { gebeAbgelaufeneFrei } from "../src/buchung/daten/belegung";
import { sendeFaelligeErinnerungen } from "../src/buchung/post/senden";

const jetzt = new Date();
const verfallen = await gebeAbgelaufeneFrei(jetzt);
const erinnert = await sendeFaelligeErinnerungen(jetzt);
// Bookings that never came about, six months on (Datenschutzerklärung).
const geloescht = await loescheNichtZustandegekommene(jetzt);

console.log(
  `Buchung-Takt ${jetzt.toISOString()}: ${verfallen.length} Reservierung(en) verfallen, ${erinnert} Erinnerung(en) gesendet, ${geloescht} alte Anfrage(n) gelöscht.`,
);
process.exit(0);
