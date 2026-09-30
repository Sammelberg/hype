// Errors meant for the person in front of the admin: a German sentence, and the input to blame if
// there is one. The action client (admin/_actions/client.ts) passes these on as they are; anything
// else is a fault of ours and becomes one generic line (the details go to the server log).
export class CmsError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
  }
}
