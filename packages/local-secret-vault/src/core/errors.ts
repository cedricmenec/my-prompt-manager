/**
 * Typed error classes for the encrypted vault SDK.
 */

export class VaultError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VaultError'
  }
}

export class WrongPassphraseError extends VaultError {
  constructor(message = 'Wrong password') {
    super(message)
    this.name = 'WrongPassphraseError'
  }
}

export class VaultNotFoundError extends VaultError {
  constructor(message = 'No vault found') {
    super(message)
    this.name = 'VaultNotFoundError'
  }
}

export class VaultLockedError extends VaultError {
  constructor(message = 'Vault is not unlocked') {
    super(message)
    this.name = 'VaultLockedError'
  }
}

export class CryptoUnavailableError extends VaultError {
  constructor(message = 'Web Crypto API is not available') {
    super(message)
    this.name = 'CryptoUnavailableError'
  }
}