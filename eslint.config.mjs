import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwind from "eslint-plugin-better-tailwindcss";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["src/app/(admin)/**"],
    extends: [betterTailwind.configs.correctness],
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/app/(frontend)/globals.css",
        callees: ["cn", "cva"],
      },
    },
  },
  // The admin has its own stylesheet and tokens (src/app/(admin)/admin.css).
  {
    files: ["src/app/(admin)/**/*.{ts,tsx}"],
    extends: [betterTailwind.configs.correctness],
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/app/(admin)/admin.css",
        callees: ["cn", "cva"],
      },
    },
  },
  // Scroll motion has one door (docs/motion-architecture.md): GSAP, ScrollTrigger and Lenis are
  // imported only by src/lib/motion and src/components/motion, and a scroll-linked tween is a
  // scrollScene, whose types admit only composited properties and no per-frame callback.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/motion/**", "src/components/motion/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "gsap", message: "Import gsap from @/lib/motion/gsap." },
            { name: "@gsap/react", message: "Import useGSAP from @/lib/motion/gsap." },
            {
              name: "lenis",
              message: "Smooth scrolling is <SmoothScroll /> (@/components/motion).",
            },
          ],
          patterns: [
            {
              group: ["gsap/*", "lenis/*"],
              message: "Scroll motion goes through @/lib/motion (docs/motion-architecture.md).",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "Property[key.name='scrollTrigger']",
          message:
            "A scroll-linked tween is a scrollScene (@/lib/motion/scene): composited properties only.",
        },
        {
          selector: "ImportSpecifier[imported.name='ScrollTrigger']",
          message: "ScrollTrigger stays inside src/lib/motion; use scrollScene or refreshScroll.",
        },
      ],
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
    "src/cms/migrations/**",
  ]),
]);
