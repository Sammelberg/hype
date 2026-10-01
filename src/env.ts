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
