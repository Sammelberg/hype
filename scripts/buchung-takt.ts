// `pnpm cms:buchung-takt` — the booking engine's beat, from cron on the server every five minutes
// (deploy/aufgabe.sh buchung-takt): holds whose time ran out lapse, their Darsteller are free again.
// The website already counts a lapsed hold as free; this makes it so in the admin too.
import { gebeAbgelaufeneFrei } from "../src/buchung/daten/belegung";

const jetzt = new Date();
const verfallen = await gebeAbgelaufeneFrei(jetzt);

console.log(`Buchung-Takt ${jetzt.toISOString()}: ${verfallen.length} Reservierung(en) verfallen.`);
process.exit(0);
