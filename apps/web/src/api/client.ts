import type { MapItem, NoteCategory } from "@stickerboard/shared";

// Same-origin: the Vite dev server proxies /api to the local API
// (see vite.config.ts), so this works on localhost and across the LAN with no
// hardcoded machine IP.
const BASE = "";
const TOKEN_KEY = "stickerboard:token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
  }
}

export interface AuthUser {
  id: string;
  email: string;
}
interface AuthResult {
  user: AuthUser;
  token: string;
}

async function errorCode(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? `http_${res.status}`;
}

async function authRequest(
  path: "signup" | "login",
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await fetch(`${BASE}/api/v1/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await errorCode(res));
  return res.json() as Promise<AuthResult>;
}

export const signupRequest = (e: string, p: string) =>
  authRequest("signup", e, p);
export const loginRequest = (e: string, p: string) =>
  authRequest("login", e, p);

export interface NewNote {
  title: string;
  body?: string;
  lat: number;
  lng: number;
  ttlSeconds: number | null;
  category?: NoteCategory;
}

export async function createNote(note: NewNote): Promise<MapItem> {
  const token = getToken();
  const res = await fetch(`${BASE}/api/v1/notes`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error(await errorCode(res));
  return res.json() as Promise<MapItem>;
}

export async function fetchPins(): Promise<MapItem[]> {
  const token = getToken();
  const res = await fetch(`${BASE}/api/v1/map/pins`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await errorCode(res));
  const data = (await res.json()) as { items: MapItem[] };
  return data.items;
}

export interface ReactionResult {
  reactions: number;
  reacted: boolean;
}

/** Toggle the current user's +1 on a board. Requires auth. */
export async function toggleReaction(boardId: string): Promise<ReactionResult> {
  const token = getToken();
  const res = await fetch(`${BASE}/api/v1/boards/${boardId}/reactions`, {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await errorCode(res));
  return res.json() as Promise<ReactionResult>;
}
