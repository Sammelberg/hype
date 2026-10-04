// Shared by the booking repositories: the error the admin and the booking form show as it is.
import { CmsError } from "../../cms/errors";

export class BuchungFehler extends CmsError {
  constructor(message: string, field?: string) {
    super(message, field);
  }
}
