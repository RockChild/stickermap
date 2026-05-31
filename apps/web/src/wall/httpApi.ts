import { getToken } from "../api/client.js";
import {
  WallError,
  type Wall,
  type WallApi,
  type WallErrorCode,
} from "./contract.js";

// Same-origin (Vite proxies /api to the API in dev).
const BASE = "";

function headers(json = false): HeadersInit {
  const token = getToken();
  return {
    ...(json ? { "content-type": "application/json" } : {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

function codeFromStatus(status: number): WallErrorCode {
  if (status === 401) return "unauthenticated";
  if (status === 402) return "pin_quota_reached";
  if (status === 404) return "not_found";
  return "not_allowed";
}

async function asWall(res: Response): Promise<Wall> {
  if (res.ok) return res.json() as Promise<Wall>;
  throw new WallError(codeFromStatus(res.status));
}

const u = (handle: string) =>
  `${BASE}/api/v1/walls/${encodeURIComponent(handle)}`;

/** Live backend implementation of the WallApi contract. */
export const httpWallApi: WallApi = {
  getWall: (handle) => fetch(u(handle), { headers: headers() }).then(asWall),

  stick: (handle, input) =>
    fetch(`${u(handle)}/stickers`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(input),
    }).then(asWall),

  setPin: (handle, stickerId, pinned) =>
    fetch(`${u(handle)}/stickers/${stickerId}/pin`, {
      method: "PUT",
      headers: headers(true),
      body: JSON.stringify({ pinned }),
    }).then(asWall),

  remove: (handle, stickerId) =>
    fetch(`${u(handle)}/stickers/${stickerId}`, {
      method: "DELETE",
      headers: headers(),
    }).then(asWall),

  setPolicy: (handle, policy) =>
    fetch(`${u(handle)}/policy`, {
      method: "PUT",
      headers: headers(true),
      body: JSON.stringify({ policy }),
    }).then(asWall),

  react: (handle, stickerId) =>
    fetch(`${u(handle)}/stickers/${stickerId}/reactions`, {
      method: "POST",
      headers: headers(),
    }).then(asWall),
};
