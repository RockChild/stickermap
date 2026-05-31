import bcrypt from "bcryptjs";

// bcryptjs (pure JS) — same bcrypt algorithm, no native build. Swap for the
// native `bcrypt` package if hashing throughput becomes a bottleneck.
const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
