# Produktmarketing-Kontext — Schwarzwald Systems

Version v2 · Stand 01.10.2026 · Land: Deutschland (Annahme, nicht bestätigt) · Sprache: Deutsch, Anrede „Sie“

Quellen: `CLAUDE.md` → „Project“ (Angaben des Inhabers vom 29.09.2026), die veröffentlichten Seitentexte
(`scripts/seed-data.ts`, Datenbank), Datenschutzerklärung. Keine weiteren Quellen gelesen.

## Kurzüberblick

| Bereich         | Inhalt                                                                                                                                                                         | Evidenz                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Produkt         | Individuelle Softwareentwicklung: Web-Anwendungen für jedes Gerät (keine nativen Apps), Geschäftssysteme mit E-Rechnung, Schnittstellen, Modernisierung, Betrieb; Online-Shops | Verifizierter Fakt (Inhaber, 01.10.2026)       |
| Anbieter        | Schwarzwald Systems, Einzelunternehmen, Inhaber Oleksandr Zamula, Freiburg im Breisgau                                                                                         | Verifizierter Fakt                             |
| Zielgruppe      | Entscheider im deutschen Mittelstand                                                                                                                                           | Verifizierter Fakt (Inhaber)                   |
| Job der Website | Projektanfragen über /kontakt                                                                                                                                                  | Verifizierter Fakt                             |
| Eigenes Produkt | Meistrum (Software für Handwerksbetriebe), nur als Kundenprojekt gezeigt (Krone Parkett)                                                                                       | Verifizierter Fakt (Entscheidung des Inhabers) |

## Zulässige Aussagen (vom Inhaber bestätigt, 29.09.2026)

- Quellcode und Dokumentation werden vollständig übergeben; keine Bindung an uns als Anbieter.
- Feste Ansprechpartner: wer anfragt, spricht direkt mit dem Inhaber.
- Alles läuft auf dem eigenen Server des Kunden: bei einem deutschen Anbieter (z. B. IONOS) oder im Haus, ohne Dienste von US-Anbietern (Inhaber, 01.10.2026).
- Keine nativen Apps für iOS und Android: Web-Anwendungen für Smartphone, Tablet, Notebook und PC aus einem Code, installierbar und offline nutzbar, wo nötig (Inhaber, 01.10.2026).
- Geschäftssysteme: Website mit CMS plus interne Steuerzentrale (Kunden, Angebote, Aufträge, Verträge, Rechnungen, Mahnungen, Kalender, Wiedervorlagen, Steuerberater-Export mit DATEV) — belegt durch `src/buero` und `src/cms`.
- E-Rechnung: XRechnung 3.0 (UBL) nach EN 16931, mit dem KoSIT-Validator und Mustang geprüft, GoBD-Festschreibung per Datenbank-Trigger (belegt im Code); Meistrum zusätzlich ZUGFeRD 2.3 in PDF/A-3 und Empfang von UBL/CII.
- Online-Shops auf demselben Stack (Shop-Kern Medusa), Zahlungsanbieter bevorzugt aus der EU, PayPal/Stripe auf Wunsch.
- Technologie-Stack darf genannt werden (Inhaber, 01.10.2026): Next.js, React, TypeScript, PostgreSQL, Docker, Caddy, Linux-Server in Deutschland u. a.
- Ablauf: Workshop → schriftliche Einschätzung zu Umfang und Vorgehen → klickbarer Prototyp → Entwicklung in kurzen Iterationen mit lauffähigen Zwischenständen → Betrieb und Weiterentwicklung.
- Modernisierung in Etappen bei laufendem Betrieb; oft zuerst neue Oberfläche auf bestehender Datenbasis.
- Meistrum: Kundenverwaltung, Kalkulation, Rechnungsstellung, Werkzeug-Inventar, Team- und Objektplanung; jede Instanz single-tenant auf eigener Infrastruktur.

## Unbekannt (nicht behaupten, bis der Inhaber es nennt)

- Berufserfahrung, Werdegang, Teamgröße, Mitarbeitende neben dem Inhaber
- Preismodell (Festpreis/Aufwand), Mindestgröße, Preisspannen
- Reaktionszeit auf Anfragen, Verfügbarkeit, SLA-Zusagen im Betrieb
- Einzugsgebiet (regional, deutschlandweit, DACH, remote)
- Weitere Referenzen, Kennzahlen, Ergebnisse (auch zu Krone Parkett), Zertifikate
- Einsparungen in Euro oder Stunden: nur als markiertes Rechenbeispiel, nie als Zusage
- Superlative („die technologischste Firma“): nicht belegbar (UWG § 5), stattdessen prüfbare Einzelheiten
- Kontakt-E-Mail, Telefon

## Stimme

Sachlich, konkret, ruhig; kurze Sätze; Nutzen aus Sicht des Betriebs; keine Superlative, keine Versprechen
zu Zeit oder Geld ohne Beleg. Begriffe der Zielgruppe: Betrieb, Abläufe, Altsystem, Schnittstelle, Excel-Liste,
Doppeleingabe, Außendienst. Vermeiden: Buzzwords (Digitalisierungsoffensive, disruptiv, KI-gestützt), Anglizismen,
wo es ein deutsches Wort gibt.

## Prüfbedarf

Datenschutzerklärung und Impressum vor dem Start prüfen lassen; jede Aussage zu Hosting und Datenflüssen muss
mit der Datenschutzerklärung übereinstimmen.

## Änderungsprotokoll

- v1 (01.10.2026): erstellt aus `CLAUDE.md` und den Seitentexten für die Leistungsseiten.
- v2 (01.10.2026): Angaben des Inhabers zum Leistungsbild — keine nativen Apps, Geschäftssysteme statt „Mobile Apps“, E-Rechnung als Hauptthema, Online-Shops, Datensouveränität (eigener Server), Stack nennbar.
