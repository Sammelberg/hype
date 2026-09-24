// PreToolUse hook: git commands that publish or destroy work stay with the human. Claude gets
// exit code 2 and the reason; the user runs them with `! <command>` when wanted.
const DANGEROUS = [
  /\bgit\s+push\b/,
  /\bgit\s+reset\s+.*--hard\b/,
  /\bgit\s+clean\s+-\w*f/,
  /\bgit\s+branch\s+.*-D\b/,
  /\bgit\s+checkout\s+(--\s+)?\.(\s|$)/,
  /\bgit\s+restore\s+(.*\s)?\.(\s|$)/,
];

let input = "";
for await (const chunk of process.stdin) input += chunk;

const command = JSON.parse(input).tool_input?.command ?? "";
const match = DANGEROUS.find((pattern) => pattern.test(command));
if (match) {
  console.error(
    `BLOCKED: "${command}" matches ${match}. Publishing or discarding work is the user's call; ask them to run it with \`! <command>\`.`,
  );
  process.exit(2);
}
