export interface GameOverMessage {
  source: 'dou-shou-qi'
  type: 'gameOver'
  winner: 'red' | 'blue'
  aiOwner: 'red' | 'blue' | null
}

export function isGameOverMessage(data: unknown): data is GameOverMessage {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.source === 'dou-shou-qi' &&
    message.type === 'gameOver' &&
    (message.winner === 'red' || message.winner === 'blue') &&
    (message.aiOwner === 'red' || message.aiOwner === 'blue' || message.aiOwner === null)
  )
}

export function isTrustedGameOverMessage(
  event: Pick<MessageEvent, 'data' | 'origin' | 'source'>,
  expectedSource: MessageEventSource | null,
  expectedOrigin: string,
): event is MessageEvent<GameOverMessage> {
  return (
    expectedSource !== null &&
    event.source === expectedSource &&
    event.origin === expectedOrigin &&
    isGameOverMessage(event.data)
  )
}
