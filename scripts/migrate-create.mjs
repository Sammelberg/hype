// `pnpm migrate:create <name>`: Payload migration + type-import fix + formatting.
// A shell `a && b && c` script would append <name> to the last command, not to Payload.
import { execFileSync } from "node:child_process";

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });

run("pnpm", ["exec", "payload", "migrate:create", ...process.argv.slice(2)]);
run("node", ["scripts/fix-migration-imports.mjs"]);
run("pnpm", ["exec", "prettier", "--write", "migrations"]);
