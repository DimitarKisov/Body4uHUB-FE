/** `?returnTo=` comes from the URL, so only same-origin paths count ("/x", not "//evil.com" or "/\evil.com"). */
export function safeReturnTo(value: string | null): string | null {
  return value && /^\/(?![/\\])/.test(value) ? value : null;
}
