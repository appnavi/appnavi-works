function getEnv(key: string): string {
  const val = process.env[key];
  if (typeof val !== "string") {
    throw new Error(`環境変数${key}は存在しません。`);
  }
  return val;
}
export { getEnv };
