import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

// Crawlers that only collect text for training AI models (owner's decision, 2026-09-29). Search and
// answer bots (OAI-SearchBot, Claude-SearchBot, ChatGPT-User, Claude-User, …) stay allowed, so AI
// answers can still cite and link the site; Google-Extended and Applebot-Extended leave search alone.
const TRAINING_CRAWLERS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/next", "/buchung/", "/buchen/frei"],
      },
      { userAgent: TRAINING_CRAWLERS, disallow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
