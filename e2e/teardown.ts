import { execFileSync } from "node:child_process";

// After every run: remove the contact messages the tests sent (scripts/clean-e2e.ts).
export default function teardown() {
  execFileSync("pnpm", ["exec", "tsx", "--env-file-if-exists=.env", "scripts/clean-e2e.ts"], {
    stdio: "inherit",
  });
}
