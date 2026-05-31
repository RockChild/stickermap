// Username helpers. Handles are lowercase [a-z0-9_], 3–20 chars.

const ADJECTIVES = [
  "happy",
  "brave",
  "sunny",
  "cozy",
  "witty",
  "mellow",
  "lucky",
  "clever",
  "jolly",
  "snug",
  "fuzzy",
  "peppy",
  "keen",
  "merry",
  "plucky",
  "calm",
];

const NOUNS = [
  "otter",
  "maple",
  "pixel",
  "comet",
  "pebble",
  "willow",
  "fern",
  "badger",
  "sparrow",
  "cocoa",
  "nimbus",
  "robin",
  "poppy",
  "juniper",
  "cricket",
  "mango",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value);
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

/** A random, valid handle like "brave_maple_473". */
export function generateNickname(): string {
  const n = 100 + Math.floor(Math.random() * 900);
  return `${pick(ADJECTIVES)}_${pick(NOUNS)}_${n}`;
}
