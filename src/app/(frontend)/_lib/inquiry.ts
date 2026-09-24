// The homepage configurator turns a few choices into the opening of a contact message.

export type InquiryChoices = { services: string[]; scope?: string; timing?: string };

function list(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} und ${items.at(-1)}`;
}

export function buildInquiry({ services, scope, timing }: InquiryChoices) {
  const lines = [
    services.length ? `ich interessiere mich für: ${list(services)}.` : null,
    scope ? `Umfang: ${scope}.` : null,
    timing ? `Zeitrahmen: ${timing}.` : null,
  ].filter(Boolean);
  return `Guten Tag,\n\n${lines.length ? `${lines.join("\n")}\n\n` : ""}Kurz zu meinem Vorhaben: `;
}

export function inquiryHref(message: string) {
  return `/kontakt?${new URLSearchParams({ nachricht: message })}`;
}
