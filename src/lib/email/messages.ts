// The site's own e-mails (Anrede „Sie“): the test mail of „E-Mail-Versand“, the „Passwort
// vergessen“ link and the note about a new contact message. Plain text, so every mail program
// shows them alike; values from people (names, messages) go in as they are, never as markup.

export interface Mail {
  subject: string;
  text: string;
}

export function testMail(senderName: string): Mail {
  return {
    subject: `Test: E-Mail-Versand – ${senderName}`,
    text: [
      "Guten Tag,",
      "",
      "diese Test-E-Mail kommt aus der Verwaltung Ihrer Website. Der E-Mail-Versand ist richtig eingerichtet.",
      "",
      "Mit freundlichen Grüßen",
      senderName,
    ].join("\n"),
  };
}

/** The „Passwort vergessen“ mail with its one-time link (cms/auth/reset.ts). */
export function passwordResetMail(input: { url: string; siteName: string; minutes: number }): Mail {
  return {
    subject: `Passwort zurücksetzen – ${input.siteName}`,
    text: [
      "Guten Tag,",
      "",
      `für Ihren Zugang zur Verwaltung von „${input.siteName}“ wurde ein neues Passwort angefordert. Über diesen Link legen Sie es fest; er gilt ${input.minutes} Minuten und nur einmal:`,
      "",
      input.url,
      "",
      "Wenn Sie das nicht angefordert haben, ignorieren Sie diese E-Mail. Ihr Passwort bleibt dann unverändert.",
    ].join("\n"),
  };
}

/** A new message from the contact form, to the address set under „E-Mail-Versand“. */
export function anfrageMail(input: {
  siteName: string;
  formTitle: string;
  fields: { label: string; value: string }[];
  url: string;
}): Mail {
  const lines = input.fields
    .filter((field) => field.value.trim() !== "")
    .flatMap((field) =>
      field.value.includes("\n")
        ? [`${field.label}:`, field.value.trim(), ""]
        : [`${field.label}: ${field.value.trim()}`],
    );
  return {
    subject: `Neue Nachricht über „${input.formTitle}“ – ${input.siteName}`,
    text: [
      `Über das Formular „${input.formTitle}“ auf Ihrer Website ist eine Nachricht eingegangen:`,
      "",
      ...lines,
      "",
      `In der Verwaltung: ${input.url}`,
    ]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n"),
  };
}
