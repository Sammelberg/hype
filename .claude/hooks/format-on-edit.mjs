// PostToolUse hook: format the file Claude just wrote with Prettier (project config + Tailwind class sorting).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { extname, relative, resolve } from "node:path";

const FORMATTABLE = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
  ".mdx",
  ".yml",
  ".yaml",
]);

let input = "";
for await (const chunk of process.stdin) input += chunk;

try {
  const { tool_input: toolInput = {}, cwd = process.cwd() } = JSON.parse(input);
  const file = toolInput.file_path;
  if (!file || !FORMATTABLE.has(extname(file)) || !existsSync(file)) process.exit(0);
  const root = process.env.CLAUDE_PROJECT_DIR ?? cwd;
  if (relative(root, resolve(file)).startsWith("..")) process.exit(0);
  execFileSync(resolve(root, "node_modules/.bin/prettier"), ["--write", "--ignore-unknown", file], {
    cwd: root,
    stdio: "ignore",
    timeout: 15000,
  });
} catch {
  // Formatting is best-effort; never block the edit.
}
