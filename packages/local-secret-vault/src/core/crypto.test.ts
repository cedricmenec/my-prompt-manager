import { describe, expect, it } from 'vitest'
import {
  generateSalt,
  generateIv,
  deriveKey,
  deriveVerifyHash,
  encrypt,
  decrypt,
  isWebCryptoAvailable,
  arraysEqual,
} from '../core/crypto'

describe('crypto', () => {
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
    it('derives an AES-GCM CryptoKey from passphrase and salt', async () => {
      const salt = generateSalt()
      const key = await deriveKey('test-passphrase', salt)
      expect(key).toBeInstanceOf(CryptoKey)
      expect(key.algorithm).toMatchObject({
        name: 'AES-GCM',
        length: 256,
      })
      expect(key.usages).toContain('encrypt')
      expect(key.usages).toContain('decrypt')
    })

    it('derives different keys for different salts', async () => {
      const passphrase = 'test-passphrase'
      const saltA = generateSalt()
      const saltB = generateSalt()
      const keyA = await deriveKey(passphrase, saltA)
      const keyB = await deriveKey(passphrase, saltB)

      // Verify keys produce different ciphertexts for the same plaintext
      const iv = generateIv()
      const plaintext = 'test data'
      const ctA = await encrypt(keyA, iv, plaintext)
      const ctB = await encrypt(keyB, iv, plaintext)
      expect(Array.from(ctA)).not.toEqual(Array.from(ctB))
    })
  })

  // --- Verify hash ---
  describe('deriveVerifyHash', () => {
    it('returns a 32-byte hash', async () => {
      const salt = generateSalt()
      const hash = await deriveVerifyHash('test-passphrase', salt)
      expect(hash).toBeInstanceOf(Uint8Array)
      expect(hash.length).toBe(32)
    })

    it('returns same hash for same passphrase and salt', async () => {
      const salt = generateSalt()
      const [hashA, hashB] = await Promise.all([
        deriveVerifyHash('test-passphrase', salt),
        deriveVerifyHash('test-passphrase', salt),
      ])
      expect(arraysEqual(hashA, hashB)).toBe(true)
    })

    it('returns different hash for different passphrase', async () => {
      const salt = generateSalt()
      const [hashA, hashB] = await Promise.all([
        deriveVerifyHash('passphrase-a', salt),
        deriveVerifyHash('passphrase-b', salt),
      ])
      expect(arraysEqual(hashA, hashB)).toBe(false)
    })
  })

  // --- Encrypt / Decrypt round-trip ---
  describe('encrypt / decrypt', () => {
    it('encrypts and decrypts successfully', async () => {
      const salt = generateSalt()
      const iv = generateIv()
      const key = await deriveKey('test-passphrase', salt)
      const original = 'Hello, vault!'

      const ciphertext = await encrypt(key, iv, original)
      expect(ciphertext).toBeInstanceOf(Uint8Array)
      expect(ciphertext.length).toBeGreaterThan(original.length)

      const decrypted = await decrypt(key, iv, ciphertext)
      expect(decrypted).toBe(original)
    })

    it('fails to decrypt with wrong key', async () => {
      const salt = generateSalt()
      const iv = generateIv()
      const keyA = await deriveKey('correct-passphrase', salt)
      const keyB = await deriveKey('wrong-passphrase', salt)

      const ciphertext = await encrypt(keyA, iv, 'Secret data')

      await expect(decrypt(keyB, iv, ciphertext)).rejects.toThrow()
    })

    it('produces different ciphertexts with different IVs', async () => {
      const salt = generateSalt()
      const key = await deriveKey('test-passphrase', salt)
      const plaintext = 'Same text'

      const ivA = generateIv()
      const ivB = generateIv()

      const ctA = await encrypt(key, ivA, plaintext)
      const ctB = await encrypt(key, ivB, plaintext)

      expect(Array.from(ctA)).not.toEqual(Array.from(ctB))
    })
  })

  // --- arraysEqual ---
  describe('arraysEqual', () => {
    it('returns true for identical arrays', () => {
      const a = new Uint8Array([1, 2, 3])
      const b = new Uint8Array([1, 2, 3])
      expect(arraysEqual(a, b)).toBe(true)
    })

    it('returns false for different arrays', () => {
      const a = new Uint8Array([1, 2, 3])
      const b = new Uint8Array([1, 2, 4])
      expect(arraysEqual(a, b)).toBe(false)
    })

    it('returns false for arrays of different length', () => {
      const a = new Uint8Array([1, 2, 3])
      const b = new Uint8Array([1, 2, 3, 4])
      expect(arraysEqual(a, b)).toBe(false)
    })
  })
})