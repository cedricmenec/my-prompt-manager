/**
 * App-specific vault payload type.
 *
 * The SDK is generic over the payload shape; this file defines
 * the concrete payload used by the prompt manager application.
 */

import type { VaultPayloadBase } from '@byo-prompt/encrypted-vault/core'

export interface VaultPayload extends VaultPayloadBase {
  version: 1
  apiKeys: Record<string, string>
}