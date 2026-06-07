/**
 * Low-level Web Crypto API helpers for the encrypted vault.
 *
 * Uses PBKDF2-SHA256 (600k iterations) for key derivation and
 * AES-256-GCM for authenticated encryption. All inputs/outputs
 * use Uint8Array — no base64 or hex encoding at this layer.
 */

const PBKDF2_ITERATIONS = 600_000
const VERIFY_ITERATIONS = 1_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/** Returns true when `window.crypto.subtle` is accessible. */
export function isWebCryptoAvailable(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined'
}

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------

export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

export function generateIv(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

async function deriveRawKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Derive the full AES-256-GCM encryption key from the passphrase (600k iterations).
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  return deriveRawKey(passphrase, salt, PBKDF2_ITERATIONS)
}

/**
 * Derive a lightweight "verify hash" (PBKDF2 with 1 000 iterations) used for
 * fast passphrase validation before attempting the expensive full derivation.
 */
export async function deriveVerifyHash(
  passphrase: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: VERIFY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256, // 32 bytes
  )

  return new Uint8Array(bits)
}

// ---------------------------------------------------------------------------
// Encrypt / Decrypt
// ---------------------------------------------------------------------------

export async function encrypt(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: string,
): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )
  return new Uint8Array(encrypted)
}

export async function decrypt(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: Uint8Array,
): Promise<string> {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )
  return new TextDecoder().decode(decrypted)
}
