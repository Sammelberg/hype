// How long what is kept. Pure, so the boundary can be tested; the Datenschutzerklärung states
// the same numbers (scripts/seed-data.ts, page „datenschutz“).
import { subMonths } from "date-fns";

// Contact messages: six months after they arrived, answered or not (the owner's decision of
// 2026-09-30). What becomes an order lives on in the office, not in the inbox.
export const ANFRAGEN_MONATE = 6;

// The moment before which a message is due: the same day and time, `monate` months earlier
// (at the end of a shorter month: its last day).
export const loeschGrenze = (now: Date, monate = ANFRAGEN_MONATE) => subMonths(now, monate);
