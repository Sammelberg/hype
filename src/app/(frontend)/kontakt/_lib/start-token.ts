import "server-only";

import { connection } from "next/server";

import { env } from "@/env";
import { signStart } from "./form-token";

// A start time signed for this visit. It needs the request, so /kontakt renders per visit
// (a static page would carry its build time, valid for everyone): the form works without JS.
export async function freshStartToken() {
  await connection();
  return signStart(Date.now(), env.FORM_SECRET);
}
