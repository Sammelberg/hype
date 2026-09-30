import { execFileSync } from "node:child_process";

// Before every run: make sure the e2e account exists (scripts/prepare-e2e.ts).
export default function setup() {
  execFileSync("pnpm", ["exec", "tsx", "--env-file-if-exists=.env", "scripts/prepare-e2e.ts"], {
    stdio: "inherit",
  });
}
