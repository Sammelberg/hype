// The Fenster: the whole time a Darsteller is taken for one Einsatz. Arithmetic on instants only,
// so a night the clocks change neither shrinks nor stretches it.

const MIN = 60_000;

export type FensterEingabe = {
  /** The party's start as agreed with the customer. */
  beginn: Date;
  /** One way, from the Zone. */
  fahrtMinuten: number;
  vorbereitungMin: number;
  dauerMin: number;
  extrasDeltaMin: number;
  abbauMin: number;
};

export type Fenster = { von: Date; bis: Date; partyEnde: Date };

export function berechneFenster(e: FensterEingabe): Fenster {
  const beginn = e.beginn.getTime();
  const partyEnde = beginn + (e.dauerMin + e.extrasDeltaMin) * MIN;
  return {
    von: new Date(beginn - (e.fahrtMinuten + e.vorbereitungMin) * MIN),
    partyEnde: new Date(partyEnde),
    bis: new Date(partyEnde + (e.abbauMin + e.fahrtMinuten) * MIN),
  };
}
