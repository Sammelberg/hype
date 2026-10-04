// How the Anzahlung is paid, behind one interface: Mollie for private customers (phase 9), the
// test adapter for development and CI. An adapter only starts a payment and says where the
// customer goes; whether it was paid is always confirmed by the server (daten/zahlungen.ts).
import type { ZahlungAdapterName } from "../logik/typen";

export type ZahlungStart = {
  zahlungId: number;
  buchungNummer: string;
  betragCent: number;
  /** The customer's link token: the checkout returns to /buchung/<token>. */
  token: string;
  beschreibung: string;
};

export interface ZahlungsAdapter {
  name: ZahlungAdapterName;
  /** Opens a payment with the provider; returns its id there and the checkout's address. */
  starte(z: ZahlungStart): Promise<{ externId: string; weiter: string }>;
}
