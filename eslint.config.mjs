import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwind from "eslint-plugin-better-tailwindcss";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [betterTailwind.configs.correctness],
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/app/(frontend)/globals.css",
        callees: ["cn", "cva"],
      },
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    ".claude/**",
    "graft/**",
    "playwright-report/**",
    "test-results/**",
    "src/payload-types.ts",
    "src/migrations/**",
    "src/app/(payload)/**",
  ]),
]);
