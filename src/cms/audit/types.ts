// What the audit log records, and how the admin names it. Pure: the log screen uses it too.

// Who did it: an account, or a script on the server (id null, the script's name as e-mail).
export type Actor = { id: number | null; email: string | null };

export const SHELL: Actor = { id: null, email: "Kommandozeile" };

export const AUDIT_ACTIONS = {
  anmeldung: "Angemeldet",
  "anmeldung.fehlgeschlagen": "Anmeldung fehlgeschlagen",
  "zugang.angelegt": "Zugang angelegt",
  "zugang.rolle": "Rolle geändert",
  "zugang.passwort-vergeben": "Vorläufiges Passwort vergeben",
  "zugang.passwort-geaendert": "Eigenes Passwort gewählt",
  "zugang.entsperrt": "Zugang entsperrt",
  "zugang.abgemeldet": "Überall abgemeldet",
  "zugang.geloescht": "Zugang gelöscht",
  "zugang.passwort-link": "Link „Passwort vergessen“ gesendet",
  "zugang.passwort-zurueckgesetzt": "Passwort über den Link neu gesetzt",
  "seite.veroeffentlicht": "Seite veröffentlicht",
  "seite.zurueckgezogen": "Seite zurückgezogen",
  "seite.geloescht": "Seite gelöscht",
  "seiten.reihenfolge": "Reihenfolge der Seiten geändert",
  "seite.geplant": "Veröffentlichung geplant",
  "projekt.veroeffentlicht": "Projekt veröffentlicht",
  "projekt.zurueckgezogen": "Projekt zurückgezogen",
  "projekt.geloescht": "Projekt gelöscht",
  "projekt.geplant": "Veröffentlichung geplant",
  "website.veroeffentlicht": "Website-Texte veröffentlicht",
  "medien.hochgeladen": "Bild hochgeladen",
  "medien.geloescht": "Bild gelöscht",
  "weiterleitung.angelegt": "Weiterleitung angelegt",
  "weiterleitung.geaendert": "Weiterleitung geändert",
  "weiterleitung.geloescht": "Weiterleitung gelöscht",
  "rechnung.gestellt": "Rechnung gestellt",
  "rechnung.storniert": "Rechnung storniert",
  "rechnung.versendet": "Rechnung per E-Mail gesendet",
  "zahlung.erfasst": "Zahlung erfasst",
  "zahlung.entfernt": "Zahlung entfernt",
  "mahnung.geschrieben": "Mahnung geschrieben",
  "angebot.versendet": "Angebot versendet",
  "abo.vorbereitet": "Laufende Rechnungen vorbereitet",
  "export.steuerberater": "Export für den Steuerberater",
  "email.eingerichtet": "E-Mail-Versand geändert",
  "email.passwort-gesetzt": "E-Mail-Passwort gespeichert",
  "email.passwort-geloescht": "E-Mail-Passwort gelöscht",
  aufbewahrung: "Aufbewahrungsfristen angewendet",
  "buchung.angelegt": "Buchung angelegt",
  "buchung.status": "Buchungsstatus geändert",
  "buchung.storniert": "Buchung storniert",
  "darsteller.gesperrt": "Zeit eines Darstellers gesperrt",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export type AuditEntry = {
  actor: Actor | null;
  action: AuditAction;
  target?: { type: string; id: string | number } | null;
  details?: Record<string, unknown>;
};

export type AuditRow = {
  id: number;
  at: Date;
  userEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown>;
};

export type ChainCheck =
  | { ok: true; count: number }
  | { ok: false; count: number; brokenAt: number; reason: "hash" | "link" };
