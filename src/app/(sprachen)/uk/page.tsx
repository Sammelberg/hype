import { SprachLanding, sprachMetadata } from "../_components/landing";

// Prices and Figuren change in the admin: rebuilt every five minutes like the German pages.
export const revalidate = 300;

export const metadata = sprachMetadata("uk");

export default function Seite() {
  return <SprachLanding sprache="uk" />;
}
