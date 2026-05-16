// Read the bridge's stored pairing token + server URL. Same file
// @webstew/bridge writes — we just consume it from a different process.
// If the bridge isn't paired, the MCP server can't talk to Webstew, so
// we fail fast with a clear message claude can surface to the user.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export interface BridgeAuth {
  serverUrl: string
  pairingToken: string
  bridgeId: string
}

export function loadAuthOrThrow(): BridgeAuth {
  const p = path.join(os.homedir(), '.webstew', 'bridge.json')
  if (!fs.existsSync(p)) {
    throw new Error(
      'Webstew bridge not paired. Run `webstew-bridge connect <code>` first ' +
      '(get a code from https://webstew.net/integrations).'
    )
  }
  const raw = fs.readFileSync(p, 'utf8')
  const parsed = JSON.parse(raw) as Partial<BridgeAuth>
  if (!parsed.serverUrl || !parsed.pairingToken) {
    throw new Error('Webstew bridge config at ~/.webstew/bridge.json is incomplete.')
  }
  return {
    serverUrl: parsed.serverUrl,
    pairingToken: parsed.pairingToken,
    bridgeId: parsed.bridgeId || '',
  }
}
