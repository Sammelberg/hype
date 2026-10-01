import localFont from "next/font/local";

// Blackletter initials of the hero headline and the call to action: Kanzleyrath, Peter Wiegel's
// Kanzlei face (OFL, licence beside the file), the owner's pick from the board (2026-09-29).
// Bundled unmodified; one loader for the whole site, so the face is fetched once.
export const fraktur = localFont({
  src: "../../app/(frontend)/_fonts/kanzleyrath.ttf",
  variable: "--font-fraktur",
  display: "swap",
  fallback: ["serif"],
});
