/** Stable full SHA-256 identity for one exact Goal objective. */
export function digestThreadGoalObjective(objective: string): string {
  return new Bun.CryptoHasher('sha256').update(objective).digest('hex');
}
