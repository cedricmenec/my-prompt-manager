import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  generateSalt,
  generateIv,
  deriveKey,
  deriveVerifyHash,
  encrypt,
  decrypt,
  isWebCryptoAvailable,
} from './vaultCrypto'

describe('vaultCrypto', () => {
  // --- isWebCryptoAvailable ---

  describe('isWebCryptoAvailable', () => {
    it('returns true when window.crypto.subtle exists', () => {
      expect(isWebCryptoAvailable()).toBe(true)
    })
  })

  // --- Random generators ---

  describe('generateSalt', () => {
    it('returns a 16-byte Uint8Array', () => {
      const salt = generateSalt()
      expect(salt).toBeInstanceOf(Uint8Array)
      expect(salt.length).toBe(16)
    })

    it('generates different values on successive calls', () => {
      const a = generateSalt()
      const b = generateSalt()
      expect(Array.from(a)).not.toEqual(Array.from(b))
    })
  })

  describe('generateIv', () => {
    it('returns a 12-byte Uint8Array', () => {
      const iv = generateIv()
      expect(iv).toBeInstanceOf(Uint8Array)
      expect(iv.length).toBe(12)
    })

    it('generates different values on successive calls', () => {
      const a = generateIv()
      const b = generateIv()
      expect(Array.from(a)).not.toEqual(Array.from(b))
    })
  })

  // --- Key derivation ---

  describe('deriveKey', () => {
    it('derives an AES-GCM CryptoKey', async () => {
      const salt = generateSalt()
      const key = await deriveKey('test-passphrase', salt)
      expect(key).toBeDefined()
      expect(key.type).toBe('secret')
      expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 })
    })

    it('derives the same key from the same passphrase + salt', async () => {
      const salt = generateSalt()
      const key1 = await deriveKey('hello-world', salt)
      const key2 = await deriveKey('hello-world', salt)
      // CryptoKey objects can't be directly compared, but both should be usable
      // with the same plaintext — verified via encrypt/decrypt round-trip
      const iv = generateIv()
      const ciphertext = await encrypt(key1, iv, 'secret')
      const plaintext = await decrypt(key2, iv, ciphertext)
      expect(plaintext).toBe('secret')
    })

    it('derives different keys from different passphrases', async () => {
      const salt = generateSalt()
      const key1 = await deriveKey('passphrase-a', salt)
      const key2 = await deriveKey('passphrase-b', salt)
      const iv = generateIv()
      const ciphertext = await encrypt(key1, iv, 'secret')
      await expect(decrypt(key2, iv, ciphertext)).rejects.toThrow()
    })
  })

  describe('deriveVerifyHash', () => {
    it('returns a 32-byte Uint8Array', async () => {
      const salt = generateSalt()
      const hash = await deriveVerifyHash('test-passphrase', salt)
      expect(hash).toBeInstanceOf(Uint8Array)
      expect(hash.length).toBe(32)
    })

    it('produces the same hash for the same passphrase + salt', async () => {
      const salt = generateSalt()
      const hash1 = await deriveVerifyHash('hello', salt)
      const hash2 = await deriveVerifyHash('hello', salt)
      expect(Array.from(hash1)).toEqual(Array.from(hash2))
    })

    it('produces different hashes for different passphrases', async () => {
      const salt = generateSalt()
      const hash1 = await deriveVerifyHash('passphrase-a', salt)
      const hash2 = await deriveVerifyHash('passphrase-b', salt)
      expect(Array.from(hash1)).not.toEqual(Array.from(hash2))
    })

    it('produces different hashes for different salts', async () => {
      const hash1 = await deriveVerifyHash('hello', generateSalt())
      const hash2 = await deriveVerifyHash('hello', generateSalt())
      expect(Array.from(hash1)).not.toEqual(Array.from(hash2))
    })
  })

  // --- Encrypt / Decrypt ---

  describe('encrypt & decrypt', () => {
    it('round-trips a plaintext string', async () => {
      const salt = generateSalt()
      const iv = generateIv()
      const key = await deriveKey('test-passphrase', salt)
      const original = 'Hello, vault! 🔐'

      const ciphertext = await encrypt(key, iv, original)
      expect(ciphertext).toBeInstanceOf(Uint8Array)
      // Encrypted data should differ from plaintext
      const encoder = new TextEncoder()
      expect(Array.from(ciphertext)).not.toEqual(
        Array.from(encoder.encode(original)),
      )

      const decrypted = await decrypt(key, iv, ciphertext)
      expect(decrypted).toBe(original)
    })

    it('round-trips an empty string', async () => {
      const salt = generateSalt()
      const iv = generateIv()
      const key = await deriveKey('test-passphrase', salt)

      const ciphertext = await encrypt(key, iv, '')
      const decrypted = await decrypt(key, iv, ciphertext)
      expect(decrypted).toBe('')
    })

    it('round-trips a large payload', async () => {
      const salt = generateSalt()
      const iv = generateIv()
      const key = await deriveKey('test-passphrase', salt)
      const large = 'x'.repeat(100_000)

      const ciphertext = await encrypt(key, iv, large)
      const decrypted = await decrypt(key, iv, ciphertext)
      expect(decrypted).toBe(large)
    })

    it('fails to decrypt with a wrong key', async () => {
      const salt = generateSalt()
      const iv = generateIv()
      const key1 = await deriveKey('correct-passphrase', salt)
      const key2 = await deriveKey('wrong-passphrase', salt)

      const ciphertext = await encrypt(key1, iv, 'secret')
      await expect(decrypt(key2, iv, ciphertext)).rejects.toThrow()
    })

    it('fails to decrypt with a tampered ciphertext', async () => {
      const salt = generateSalt()
      const iv = generateIv()
      const key = await deriveKey('test-passphrase', salt)

      const ciphertext = await encrypt(key, iv, 'secret')
      // Tamper with the first byte
      ciphertext[0] ^= 0xff
      await expect(decrypt(key, iv, ciphertext)).rejects.toThrow()
    })

    it('fails to decrypt with a wrong IV', async () => {
      const salt = generateSalt()
      const key = await deriveKey('test-passphrase', salt)
      const iv1 = generateIv()
      const iv2 = generateIv()

      const ciphertext = await encrypt(key, iv1, 'secret')
      await expect(decrypt(key, iv2, ciphertext)).rejects.toThrow()
    })
  })
})
