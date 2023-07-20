import { doubleCsrf } from "csrf-csrf";
import { env } from "../../utils/env";

export const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_TOKEN_SECRET,
});
