import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const optional = z.string().min(1).optional();

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    PAYLOAD_SECRET: z.string().min(32),
    RESEND_API_KEY: optional,
    EMAIL_FROM: z.email().optional(),
    S3_BUCKET: optional,
    S3_REGION: optional,
    S3_ENDPOINT: z.url().optional(),
    S3_ACCESS_KEY_ID: optional,
    S3_SECRET_ACCESS_KEY: optional,
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
