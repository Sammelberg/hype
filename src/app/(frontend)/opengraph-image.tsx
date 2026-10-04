import { shareImage, SHARE_SIZE } from "@/components/site/share-image";
import { getSiteSettings } from "@/data/queries";

export const alt = "Vorschaubild der Website";
export const size = SHARE_SIZE;
export const contentType = "image/png";

// The home page's share image: the site's name as the title, its tagline above it.
export default async function OpengraphImage() {
  const settings = await getSiteSettings();
  const name = settings.siteName || "Website";
  return shareImage({ siteName: name, title: settings.tagline || name, kicker: null });
}
