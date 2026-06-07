const API_KEY_PATTERNS = [
  /sk-or-[A-Za-z0-9_-]+/g,
  /sk-[A-Za-z0-9_-]+/g,
]

export function redactApiSecrets(text: string): string {
  return API_KEY_PATTERNS.reduce((redacted, pattern) => redacted.replace(pattern, '[redacted-api-key]'), text)
}