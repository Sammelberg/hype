// The messages between the admin's editor and its preview iframe (preview-bridge.tsx). A module
// of its own, so the admin imports the names without the site's scrolling code.
export const REFRESH_MESSAGE = "cms:refresh";
export const FOCUS_MESSAGE = "cms:focus";
/** From the preview to the editor: the page listens now (after every load). */
export const READY_MESSAGE = "cms:ready";
export type FocusMessage = { type: typeof FOCUS_MESSAGE; zone: string | null; label?: string };
