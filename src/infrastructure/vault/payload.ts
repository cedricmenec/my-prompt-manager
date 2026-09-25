/**
 * App-specific vault payload type.
 *
 * The SDK is generic over the payload shape; this file defines
 * the concrete payload used by the prompt manager application.
 */

import type { VaultPayloadBase } from '@activarium/local-secret-vault/core'

export interface VaultPayload extends VaultPayloadBase {
  version: 1
  apiKeys: Record<string, string>
}