// What a password must look like. No Node imports: the forms in the browser use this too.
export const MIN_PASSWORD_LENGTH = 12;

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`;
  if (password.length > 200) return "Höchstens 200 Zeichen.";
  if (!/[^\s]/.test(password)) return "Bitte ein echtes Passwort.";
  return null;
}
