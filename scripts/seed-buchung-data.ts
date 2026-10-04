// The booking engine's development data: descriptive characters (never a licensed name), the
// packages, zones and towns from the client's spec, extras and two placeholder performers.
// Prices are placeholders until the owner sets them in /admin → Buchung. No reviews: proof is
// never invented.
import type { FigurKategorie, Sprache } from "../src/buchung/logik/typen";

export const seedZonen = [
  {
    code: "A",
    name: "Aschaffenburg und Umgebung",
    aufschlag: "0.00",
    fahrtMinuten: 20,
    nurAnfrage: false,
    sort: 1,
  },
  {
    code: "B",
    name: "Hanau und Offenbach",
    aufschlag: "20.00",
    fahrtMinuten: 30,
    nurAnfrage: false,
    sort: 2,
  },
  {
    code: "C",
    name: "Frankfurt und Würzburg",
    aufschlag: "40.00",
    fahrtMinuten: 50,
    nurAnfrage: false,
    sort: 3,
  },
  {
    code: "D",
    name: "Mainz und Wiesbaden",
    aufschlag: "60.00",
    fahrtMinuten: 65,
    nurAnfrage: false,
    sort: 4,
  },
  {
    code: "E",
    name: "Nürnberg und weiter",
    aufschlag: "0.00",
    fahrtMinuten: 120,
    nurAnfrage: true,
    sort: 5,
  },
];

type SeedStadt = {
  name: string;
  slug: string;
  zoneCode: string;
  seite?: { intro: string; bezirke: string; orte: string; bedingungen: string };
};

export const seedStaedte: SeedStadt[] = [
  {
    name: "Aschaffenburg",
    slug: "aschaffenburg",
    zoneCode: "A",
    seite: {
      intro:
        "In Aschaffenburg sind wir zu Hause: kurze Wege, die Anfahrt ist im Preis. Die Figur klingelt pünktlich, bleibt so lange wie gebucht und hat alles dabei, was das Programm braucht.",
      bezirke:
        "Damm, Leider, Nilkheim, Schweinheim, Obernau, Strietwald und Gailbach, dazu Goldbach, Hösbach, Mainaschaff, Kleinostheim und Großostheim.",
      orte: "Die meisten Feiern finden zu Hause oder im Garten statt, gern auch im Vereinsheim oder im Gemeinschaftsraum. Für 12 Kinder reicht ein Wohnzimmer, in dem man den Tisch beiseiteschieben kann.",
      bedingungen:
        "Anfahrt inklusive. Wir brauchen eine freie Ecke zum Umziehen und, wenn möglich, einen Parkplatz in der Nähe.",
    },
  },
  { name: "Goldbach", slug: "goldbach", zoneCode: "A" },
  { name: "Hösbach", slug: "hoesbach", zoneCode: "A" },
  { name: "Großostheim", slug: "grossostheim", zoneCode: "A" },
  {
    name: "Hanau",
    slug: "hanau",
    zoneCode: "B",
    seite: {
      intro:
        "Nach Hanau sind wir in rund einer halben Stunde unterwegs. Der Aufschlag für die Anfahrt steht im Preis, bevor Sie etwas eingeben.",
      bezirke:
        "Innenstadt, Kesselstadt, Steinheim, Großauheim, Klein-Auheim, Wolfgang und Mittelbuchen.",
      orte: "Zu Hause, im Garten oder im gemieteten Raum. Sagen Sie uns bei der Buchung, ob drinnen oder draußen gefeiert wird, dann passen wir die Spiele an.",
      bedingungen: "Aufschlag Zone B. Bitte eine freie Ecke zum Umziehen.",
    },
  },
  { name: "Offenbach am Main", slug: "offenbach", zoneCode: "B" },
  {
    name: "Frankfurt am Main",
    slug: "frankfurt",
    zoneCode: "C",
    seite: {
      intro:
        "Frankfurt fahren wir regelmäßig an. Weil die Fahrt hin und zurück zur Zeit der Figur gehört, sehen Sie freie Termine nur dort, wo das zusammen in den Tag passt.",
      bezirke:
        "Sachsenhausen, Bornheim, Nordend, Bockenheim, Höchst, Niederrad, Riedberg und alle anderen Stadtteile.",
      orte: "In der Wohnung, im Hof, im Kinderzimmer oder im Partyraum des Hauses. Für Feiern mit mehr als 12 Kindern empfehlen wir Premium mit zwei Figuren.",
      bedingungen: "Aufschlag Zone C. Wenn Parken schwierig ist, schreiben Sie es in die Notiz.",
    },
  },
  { name: "Würzburg", slug: "wuerzburg", zoneCode: "C" },
  { name: "Mainz", slug: "mainz", zoneCode: "D" },
  {
    name: "Wiesbaden",
    slug: "wiesbaden",
    zoneCode: "D",
    seite: {
      intro:
        "Wiesbaden ist unsere weiteste Zone mit Online-Buchung. Ein Fest von 90 Minuten bindet die Figur dort rund vier Stunden, darum sind die Termine knapper.",
      bezirke: "Innenstadt, Biebrich, Schierstein, Dotzheim, Sonnenberg, Bierstadt und Kastel.",
      orte: "Zu Hause, im Garten oder im Vereinsraum.",
      bedingungen: "Aufschlag Zone D. Buchung frühzeitig, Samstage sind schnell vergeben.",
    },
  },
  { name: "Nürnberg", slug: "nuernberg", zoneCode: "E" },
];

export const seedPakete = [
  {
    slug: "mini",
    name: "Mini",
    beschreibung: "Der kurze Besuch für die Kleinen.",
    leistungen: ["Eine Figur", "Begrüßung und Spiele", "Fotos mit dem Geburtstagskind"],
    dauerMin: 45,
    preis: "149.00",
    figurenAnzahl: 1,
    nurAnfrage: false,
    sort: 1,
  },
  {
    slug: "klassik",
    name: "Klassik",
    beschreibung: "Das ganze Programm mit Schminken und kleiner Show.",
    leistungen: ["Eine Figur", "Spiele und Wettbewerbe", "Kinderschminken", "Kleine Show"],
    dauerMin: 90,
    preis: "249.00",
    figurenAnzahl: 1,
    nurAnfrage: false,
    sort: 2,
  },
  {
    slug: "premium",
    name: "Premium",
    beschreibung: "Zwei Figuren, Show, Requisiten und Musik.",
    leistungen: ["Zwei Figuren", "Show mit dem Geburtstagskind", "Requisiten und Musik"],
    dauerMin: 120,
    preis: "349.00",
    figurenAnzahl: 2,
    nurAnfrage: false,
    sort: 3,
  },
  {
    slug: "kita-event",
    name: "Kita und Event",
    beschreibung:
      "Für Gruppen ab 20 Kindern, Kitas, Schulen und Feste. Rechnung an die Einrichtung.",
    leistungen: ["Programm für Gruppen ab 20 Kindern", "Rechnung an die Organisation"],
    dauerMin: null,
    preis: null,
    figurenAnzahl: 1,
    nurAnfrage: true,
    sort: 4,
  },
];

export const seedExtras = [
  {
    slug: "zweite-figur",
    name: "Zweite Figur",
    preis: "120.00",
    dauerDeltaMin: 0,
    vorlaufTage: 0,
    zusatzFigur: true,
    nurAnfrage: false,
    sort: 1,
  },
  {
    slug: "kinderschminken",
    name: "Kinderschminken",
    preis: "30.00",
    dauerDeltaMin: 20,
    vorlaufTage: 0,
    zusatzFigur: false,
    nurAnfrage: false,
    sort: 2,
  },
  {
    slug: "kerzenarrangement",
    name: "Kerzenarrangement",
    preis: "45.00",
    dauerDeltaMin: 0,
    vorlaufTage: 7,
    zusatzFigur: false,
    nurAnfrage: false,
    sort: 3,
    beschreibung: "Handgemacht, auf Bestellung gefertigt.",
  },
  {
    slug: "blumenarrangement",
    name: "Blumenarrangement",
    preis: "39.00",
    dauerDeltaMin: 0,
    vorlaufTage: 5,
    zusatzFigur: false,
    nurAnfrage: false,
    sort: 4,
    beschreibung: "Auf Bestellung gefertigt.",
  },
  {
    slug: "ballons-deko",
    name: "Ballons und Deko",
    preis: "35.00",
    dauerDeltaMin: 0,
    vorlaufTage: 0,
    zusatzFigur: false,
    nurAnfrage: false,
    sort: 5,
  },
  {
    slug: "fotograf",
    name: "Fotograf",
    preis: null,
    dauerDeltaMin: 0,
    vorlaufTage: 0,
    zusatzFigur: false,
    nurAnfrage: true,
    sort: 6,
    beschreibung: "Externer Fotograf, auf Anfrage.",
  },
];

type SeedFigur = {
  slug: string;
  name: string;
  kategorie: FigurKategorie;
  alterVon: number;
  alterBis: number;
  sprachen: Sprache[];
  kurz: string;
  programm: string[];
  sort: number;
};

export const seedFiguren: SeedFigur[] = [
  {
    slug: "eisprinzessin",
    name: "Eisprinzessin",
    kategorie: "prinzessinnen",
    alterVon: 3,
    alterBis: 8,
    sprachen: ["de", "uk", "ru"],
    kurz: "Glitzerkleid, Schneeflocken und ein Lied zum Mitsingen.",
    programm: [
      "Begrüßung im Winterzauber",
      "Schneeflocken-Tanz",
      "Eisprinzessinnen-Quiz",
      "Krönung des Geburtstagskinds",
    ],
    sort: 1,
  },
  {
    slug: "superheld-in-rot",
    name: "Superheld in Rot",
    kategorie: "superhelden",
    alterVon: 4,
    alterBis: 10,
    sprachen: ["de", "en"],
    kurz: "Heldentraining mit Parcours und Geheimmission.",
    programm: [
      "Heldenausweis für jedes Kind",
      "Parcours im Wohnzimmer oder Garten",
      "Geheime Mission",
      "Heldenurkunde",
    ],
    sort: 2,
  },
  {
    slug: "meerjungfrau",
    name: "Meerjungfrau",
    kategorie: "prinzessinnen",
    alterVon: 3,
    alterBis: 8,
    sprachen: ["de", "ru"],
    kurz: "Schatzsuche aus der Tiefe und Muschelspiele.",
    programm: [
      "Begrüßung mit Muschelhorn",
      "Schatzsuche",
      "Wellen-Spiele",
      "Perlen für jedes Kind",
    ],
    sort: 3,
  },
  {
    slug: "zauberer",
    name: "Zauberer",
    kategorie: "clowns",
    alterVon: 5,
    alterBis: 12,
    sprachen: ["de", "uk"],
    kurz: "Zaubershow, bei der die Kinder mitzaubern.",
    programm: ["Zaubershow", "Zauberschule für alle", "Ein Trick zum Mitnehmen", "Abschlusszauber"],
    sort: 4,
  },
  {
    slug: "pirat",
    name: "Piratin Kapitänin Möwe",
    kategorie: "superhelden",
    alterVon: 4,
    alterBis: 10,
    sprachen: ["de"],
    kurz: "Schatzkarte, Seemannsknoten und eine Kanonade aus Luftballons.",
    programm: ["Anheuern der Crew", "Schatzkarte lesen", "Seemannsspiele", "Schatz heben"],
    sort: 5,
  },
  {
    slug: "einhorn-fee",
    name: "Einhorn-Fee",
    kategorie: "tiere",
    alterVon: 3,
    alterBis: 7,
    sprachen: ["de", "uk", "ru"],
    kurz: "Regenbogenspiele und Feenstaub für die Kleinsten.",
    programm: [
      "Feenstaub-Begrüßung",
      "Regenbogen-Spiele",
      "Einhorn-Rennen",
      "Wunschstein für jedes Kind",
    ],
    sort: 6,
  },
  {
    slug: "dino-forscherin",
    name: "Dino-Forscherin",
    kategorie: "tiere",
    alterVon: 4,
    alterBis: 9,
    sprachen: ["de", "en"],
    kurz: "Ausgrabung im Wohnzimmer und Dino-Quiz.",
    programm: ["Expedition starten", "Knochen ausgraben", "Dino-Quiz", "Forscherurkunde"],
    sort: 7,
  },
  {
    slug: "weihnachtself",
    name: "Weihnachtself",
    kategorie: "saisonal",
    alterVon: 3,
    alterBis: 10,
    sprachen: ["de", "uk"],
    kurz: "Im Dezember: Wichtelwerkstatt und Geschenkespiele.",
    programm: [
      "Wichtelwerkstatt",
      "Geschenke-Staffel",
      "Lied zum Mitsingen",
      "Kleines Geschenk für jedes Kind",
    ],
    sort: 8,
  },
];

export const seedDarsteller = [
  {
    name: "Darstellerin 1 (Platzhalter)",
    prioritaet: 10,
    figuren: ["eisprinzessin", "meerjungfrau", "einhorn-fee", "weihnachtself", "zauberer"],
  },
  {
    name: "Darsteller 2 (Platzhalter)",
    prioritaet: 20,
    figuren: ["superheld-in-rot", "pirat", "zauberer", "dino-forscherin", "weihnachtself"],
  },
];
