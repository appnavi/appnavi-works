export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x != null;
}

export function isError(x: unknown): x is { name: string; message: string } {
  return (
    isObject(x) &&
    typeof x["name"] === "string" &&
    typeof x["message"] === "string"
  );
}

export function isUser(x: unknown): x is Express.User {
  if (!isObject(x)) return false;
  if (typeof x["id"] !== "string") return false;
  if (typeof x["name"] !== "string") return false;
  if (typeof x["type"] !== "string") return false;
  const avatar_url_type = typeof x["avatar_url"];
  if (avatar_url_type != "string" && avatar_url_type != "undefined")
    return false;
  return true;
}

declare module "express-session" {
  interface SessionData {
    csrfTokens: string | undefined;
  }
}
