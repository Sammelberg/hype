// Payload generates `import { MigrateUpArgs, MigrateDownArgs, sql }` as value imports. Under
// `verbatimModuleSyntax` and Node's type stripping those must be type-only imports.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not .pathname: the latter keeps %20 for spaces in the checkout path.
const dir = fileURLToPath(new URL("../src/migrations/", import.meta.url));

for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts")) {
  const path = join(dir, file);
  const source = readFileSync(path, "utf8");
  const fixed = source.replace(
    /import \{([^}]*)\} from (['"])@payloadcms\/db-postgres\2/,
    (_, names) =>
      `import {${names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => (/^Migrate(Up|Down)Args$/.test(n) ? `type ${n}` : n))
        .join(", ")}} from '@payloadcms/db-postgres'`,
  );
  if (fixed !== source) writeFileSync(path, fixed);
}
