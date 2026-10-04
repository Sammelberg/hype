import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    // Uploads on disk; defaults to ./media next to the app (a persistent volume in production).
    MEDIA_DIR: z.string().min(1).optional(),
    // Signs the contact form's start time (anti-spam); `openssl rand -base64 32`.
    FORM_SECRET: z.string().min(32),
    // Lets the server's timer publish scheduled pages (/next/geplant, pnpm cms:geplant);
    // `openssl rand -base64 32`. Without it nothing is published on schedule.
    CRON_SECRET: z.string().min(32).optional(),
    // Seals the mailbox password of „E-Mail-Versand“ (src/lib/email/secret.ts);
    // `openssl rand -base64 32`. Without it no password is stored and nothing is sent; a new
    // value means entering the mailbox password once more.
    MAIL_SECRET: z.string().min(32).optional(),
    // "1" serves /next/bewegung, the demo of every motion part (docs/motion-architecture.md),
    // in a production build too (CI's e2e); `next dev` always serves it. Never set on a server.
    MOTION_DEMO: z.literal("1").optional(),
    // "1" lets bookings pay their Anzahlung through the test adapter (a pretend checkout under
    // /buchung/<link>/testzahlung) — for development and CI's e2e. Never set on a server.
    ZAHLUNG_TEST: z.literal("1").optional(),
    // Mollie's API key (Dashboard → Developers): `test_…` while trying, `live_…` once the account
    // is approved. Without it the Anzahlung cannot be paid online (only by invoice).
    MOLLIE_API_KEY: z
      .string()
      .regex(/^(test|live)_\w{20,}$/, "Ein Mollie-Schlüssel beginnt mit test_ oder live_.")
      .optional(),
  },
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
