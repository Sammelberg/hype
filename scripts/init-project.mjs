// `pnpm init:project` — turns a fresh copy of this template into a new project.
// Asks for name, site name, owner, contact e-mail and app and database ports, then rewrites
// package.json, docker-compose.yml, CI, Playwright, .env(.example), the production stack in deploy/,
// seed data, CLAUDE.md, README.md and the Reticle project id; links the skill library, builds the
// graft index. Keeping the history (the default) turns the clone's `origin` (the kern repository)
// into `upstream` with push disabled, so core fixes arrive with `git pull upstream main`; a fresh
// history cuts that tie.
//
// Non-interactive: pnpm init:project --yes --name kunde-x --site-name "Kunde X" --owner "Kunde X GmbH" \
//   --email hallo@kunde-x.de --app-port 3001 --db-port 5434 --git keep
// Plain Node, no dependencies: it runs right after `pnpm install`.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = fileURLToPath(new URL("..", import.meta.url));
const file = (path) => join(root, path);
const read = (path) => readFileSync(file(path), "utf8");

const { values: args } = parseArgs({
  options: {
    yes: { type: "boolean", short: "y", default: false },
    name: { type: "string" },
    "site-name": { type: "string" },
    owner: { type: "string" },
    email: { type: "string" },
    "app-port": { type: "string" },
    "db-port": { type: "string" },
    git: { type: "string" }, // fresh | keep
  },
});

// --- Helpers ----------------------------------------------------------------------------------

const SLUG = /^[a-z][a-z0-9-]*[a-z0-9]$/;

function portIsFree(port) {
  return new Promise((resolve) => {
    const server = createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port, "127.0.0.1");
  });
}

async function firstFreePort(from) {
  for (let port = from; port < from + 50; port++) if (await portIsFree(port)) return port;
  return from;
}

// Replaces exactly; fails loudly when the template changed and a pattern no longer matches.
function edit(path, replacements) {
  let source = read(path);
  for (const [pattern, value] of replacements) {
    const next = source.replace(pattern, value);
    if (next === source && !source.includes(typeof value === "string" ? value : "\0")) {
      throw new Error(`${path}: Muster ${pattern} nicht gefunden — Vorlage geändert?`);
    }
    source = next;
  }
  writeFileSync(file(path), source);
  changed.push(path);
}

const changed = [];
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const jsString = (s) => JSON.stringify(s);

// --- Questions --------------------------------------------------------------------------------

const pkg = JSON.parse(read("package.json"));
const oldName = pkg.name;
const folder = root.split("/").filter(Boolean).at(-1) ?? "projekt";
const suggestedName = folder
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const rl = args.yes ? null : createInterface({ input: process.stdin, output: process.stdout });

async function ask(question, fallback, { flag, validate } = {}) {
  const given = flag !== undefined ? args[flag] : undefined;
  if (given !== undefined) {
    const error = validate?.(given);
    if (error) throw new Error(`--${flag}: ${error}`);
    return given;
  }
  if (!rl) return fallback;
  for (;;) {
    const answer = (await rl.question(`${question} [${fallback}]: `)).trim() || fallback;
    const error = validate?.(answer);
    if (!error) return answer;
    console.log(`  ${error}`);
  }
}

console.log(`\nNeues Projekt aus der Vorlage „${oldName}“\n`);

const name = await ask("Projektname (Kleinbuchstaben, Bindestriche)", suggestedName, {
  flag: "name",
  validate: (v) =>
    SLUG.test(v) ? null : "Nur a–z, 0–9 und Bindestriche, mit Buchstabe am Anfang.",
});
const siteName = await ask("Name der Website", name, { flag: "site-name" });
const owner = await ask("Inhaber (Person oder Firma)", siteName, { flag: "owner" });
const email = await ask("Öffentliche Kontakt-E-Mail", "hallo@example.com", {
  flag: "email",
  validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Keine gültige E-Mail-Adresse."),
});
// Each project gets its own app port: Playwright reuses whatever server answers on its port, so two
// projects on 3000 would test each other.
const appPort = await ask("Lokaler App-Port (pnpm dev)", String(await firstFreePort(3000)), {
  flag: "app-port",
  validate: (v) => (/^\d{4,5}$/.test(v) ? null : "Eine Portnummer, z. B. 3001."),
});
const dbPort = await ask("Lokaler Postgres-Port", String(await firstFreePort(5433)), {
  flag: "db-port",
  validate: (v) => (/^\d{4,5}$/.test(v) ? null : "Eine Portnummer, z. B. 5434."),
});
// Keeping kern's history keeps `git pull upstream main` working; a fresh one starts unrelated.
const freshGit = existsSync(file(".git"))
  ? (
      await ask("Git-Historie neu beginnen? (nein = Kern-Updates per upstream)", "nein", {
        flag: "git",
      })
    ).match(/^(ja|j|y|yes|fresh)$/i)
  : true;
rl?.close();

// --- Rewrite ----------------------------------------------------------------------------------

const db = name.replace(/-/g, "_");
const databaseUrl = `postgres://${db}:${db}@localhost:${dbPort}/${db}`;

pkg.name = name;
// dev on the app port, the production preview one above it (the lane: 3000 dev, 3001 preview).
for (const [script, port] of [
  ["dev", appPort],
  ["start", Number(appPort) + 1],
]) {
  pkg.scripts[script] = pkg.scripts[script].replace(/\$\{PORT:-\d+\}/, `\${PORT:-${port}}`);
}
pkg.version = "0.1.0";
writeFileSync(file("package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
changed.push("package.json");

const oldDb = oldName.replace(/-/g, "_");
edit("docker-compose.yml", [
  [/^name: .*$/m, `name: ${name}`],
  [
    new RegExp(`POSTGRES_(USER|PASSWORD|DB): ${escape(oldDb)}`, "g"),
    (_, key) => `POSTGRES_${key}: ${db}`,
  ],
  [/"127\.0\.0\.1:\d+:5432"/, `"127.0.0.1:${dbPort}:5432"`],
  [`pg_isready -U ${oldDb} -d ${oldDb}`, `pg_isready -U ${db} -d ${db}`],
]);

edit(".github/workflows/ci.yml", [
  [
    new RegExp(`POSTGRES_(USER|PASSWORD|DB): ${escape(oldDb)}`, "g"),
    (_, key) => `POSTGRES_${key}: ${db}`,
  ],
  [`pg_isready -U ${oldDb} -d ${oldDb}`, `pg_isready -U ${db} -d ${db}`],
  [/DATABASE_URL: postgres:\/\/\S+/, `DATABASE_URL: postgres://${db}:${db}@localhost:5432/${db}`],
  [
    /NEXT_PUBLIC_SERVER_URL: http:\/\/localhost:\d+/,
    `NEXT_PUBLIC_SERVER_URL: http://localhost:${appPort}`,
  ],
]);

edit("playwright.config.ts", [[/process\.env\.PORT \?\? \d+/, `process.env.PORT ?? ${appPort}`]]);

edit(".env.example", [
  [/^DATABASE_URL=.*$/m, `DATABASE_URL=${databaseUrl}`],
  [/^NEXT_PUBLIC_SERVER_URL=.*$/m, `NEXT_PUBLIC_SERVER_URL=http://localhost:${appPort}`],
]);

if (existsSync(file(".env"))) {
  console.log(
    "\n.env existiert bereits und bleibt unverändert. Neue Werte:\n" +
      `  DATABASE_URL=${databaseUrl}\n  NEXT_PUBLIC_SERVER_URL=http://localhost:${appPort}\n` +
      "  FORM_SECRET, MAIL_SECRET=<openssl rand -base64 32>, falls noch nicht gesetzt",
  );
} else {
  // A fresh secret per copy; never one that sits in the repository.
  const secret = randomBytes(32).toString("base64");
  writeFileSync(
    file(".env"),
    read(".env.example")
      .replace(/^FORM_SECRET=.*$/m, `FORM_SECRET=${secret}`)
      .replace(/^MAIL_SECRET=.*$/m, `MAIL_SECRET=${randomBytes(32).toString("base64")}`),
  );
  changed.push(".env (neu)");
}

edit("scripts/seed-data.ts", [
  [/siteName: ".*?",/, `siteName: ${jsString(siteName)},`],
  [/ownerName: ".*?",/, `ownerName: ${jsString(owner)},`],
  // A string once set, `null as string | null` in the template until the owner has one.
  [
    /contactEmail: (?:".*?"|null as string \| null),/,
    `contactEmail: ${jsString(email)} as string | null,`,
  ],
]);

edit("CLAUDE.md", [
  [/^# .*$/m, `# ${name} — ${siteName}`],
  // The "this repo is a template" note; the project is no longer one.
  [/^This repo is a \*\*core template\*\*.*\n\n/m, ""],
  [/^- \*\*Site \/ owner:\*\* .*$/m, `- **Site / owner:** ${siteName} — ${owner}`],
]);
edit("README.md", [
  [/^# .*$/m, `# ${siteName}`],
  // The backup groups and the production container carry the project's name (scripts/backup).
  [new RegExp(`\\b${escape(oldName)}-(daten|anfragen|prod-postgres-1)\\b`, "g"), `${name}-$1`],
]);

// The production stack: compose project, container, image and database names, the checkout's folder
// on the server, the edge's site file. The domain (example.de) is the owner's to set.
const word = new RegExp(`\\b${escape(oldName)}\\b`, "g");
for (const path of [
  "deploy/compose.yml",
  "deploy/edge.caddy",
  "deploy/README.md",
  "deploy/deploy.sh",
  "deploy/admin.sh",
  "deploy/aufgabe.sh",
  "deploy/einrichten.sh",
  "deploy/inhalt.sh",
  "Dockerfile",
  "scripts/inhalt-exportieren.sh",
  "scripts/aufbewahrung.ts",
  "scripts/backup/_gemeinsam.sh",
  "scripts/backup/sicherung.sh",
  "scripts/backup/wiederherstellung-test.sh",
]) {
  if (existsSync(file(path)) && new RegExp(word.source).test(read(path)))
    edit(path, [[word, name]]);
}

const reticleId = `${name}-${randomBytes(4).toString("hex")}`;
edit(".reticle.json", [[/"projectId": ".*?"/, `"projectId": "${reticleId}"`]]);
edit("src/components/dev/reticle-dev.tsx", [[/projectId: ".*?"/, `projectId: "${reticleId}"`]]);

// The skill library is linked, not committed (gitignored): from the local copy, else from a clone of
// Sammelberg/skills (link-library.sh).
const linkLibrary = file(".claude/skills/skill-router/scripts/link-library.sh");
let libraryLinked = existsSync(file(".claude/skills-library/manifest.json"));
if (!libraryLinked && existsSync(linkLibrary)) {
  try {
    execFileSync("bash", [linkLibrary], { cwd: root, stdio: "ignore" });
    libraryLinked = true;
    changed.push(".claude/skills-library (Symlinks, nicht in git)");
  } catch {
    /* source library missing on this machine; reported below */
  }
}

// graft's code graph is gitignored; a new checkout needs its own. Optional tool.
let graftBuilt = false;
try {
  execFileSync("graft", ["build"], { cwd: root, stdio: "ignore", timeout: 300_000 });
  graftBuilt = true;
  changed.push("graft/ (Index, nicht in git)");
} catch {
  /* graft not installed or failed; reported below */
}

// --- Report -----------------------------------------------------------------------------------

console.log("\nGeändert:");
for (const path of changed) console.log(`  ${path}`);

if (!graftBuilt) {
  console.log("\ngraft-Index nicht gebaut (graft fehlt?). Später: graft build");
}

if (!libraryLinked) {
  console.log(
    "\nSkill-Bibliothek nicht verknüpft: .claude/skills/skill-router/scripts/link-library.sh\n" +
      "  (Zugriff auf Sammelberg/skills nötig, oder Quelle per SKILL_LIBRARY_SRC angeben).",
  );
}

if (freshGit) {
  const git = (...a) => execFileSync("git", a, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  // A repo-local identity would vanish with .git; carry it over.
  const identity = ["user.name", "user.email"].flatMap((key) => {
    try {
      return [[key, git("config", key).toString().trim()]];
    } catch {
      return [];
    }
  });
  rmSync(file(".git"), { recursive: true, force: true });
  git("init", "-q", "-b", "main");
  for (const [key, value] of identity) git("config", key, value);
  git("add", "-A");
  try {
    // --no-verify: lint-staged would run over the whole tree before dependencies are known to work.
    git("commit", "-q", "--no-verify", "-m", `chore: start ${name} from the kern template`);
    console.log("\nGit: neue Historie mit einem ersten Commit auf main.");
  } catch (error) {
    console.log(
      `\nGit: neues Repository angelegt, Dateien vorgemerkt, Commit fehlgeschlagen:\n  ${String(
        error.stderr ?? error,
      )
        .trim()
        .split("\n")
        .at(-1)}\n` +
        '  Identität setzen (git config user.name/user.email) und "git commit" ausführen.',
    );
  }
}

if (!freshGit) {
  const git = (...a) => execFileSync("git", a, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  try {
    const origin = git("remote", "get-url", "origin").toString().trim();
    if (/[/:]kern(\.git)?$/.test(origin)) {
      git("remote", "rename", "origin", "upstream");
      git("remote", "set-url", "--push", "upstream", "DISABLED");
      console.log(
        "\nGit: origin (kern) heißt jetzt upstream, Push gesperrt. Kern-Updates: git pull upstream main." +
          "\n  Eigenes Repository: git remote add origin <url> && git push -u origin main",
      );
    }
  } catch {
    /* no origin: nothing to rename */
  }
}

console.log(`
Weiter:
  pnpm db:up        Postgres auf Port ${dbPort} (Container ${name}-postgres-1)
  pnpm migrate      Tabellen der CMS anlegen
  pnpm seed         Beispielinhalte
  pnpm cms:passwort <e-mail> --anlegen   erstes Admin-Konto (vorläufiges Passwort erscheint einmal)
  pnpm dev          http://localhost:${appPort}/admin
`);
