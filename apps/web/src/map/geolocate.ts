import { fetchIpLocation } from "../api/client.js";

export interface GeoResult {
  lat: number;
  lng: number;
  source: "gps" | "ip";
}

/**
 * Approximate location via our own API (which does the IP lookup
 * server-to-server — no browser CORS). Works on any origin incl. LAN http.
 */
export async function locateByIp(): Promise<GeoResult | null> {
  const loc = await fetchIpLocation();
  return loc ? { lat: loc.lat, lng: loc.lng, source: "ip" } : null;
}

/**
 * Precise location from the browser Geolocation API (prompts the user).
 * Only available on secure origins (HTTPS or localhost); resolves null when
 * unavailable, denied, or timed out.
 */
export function locateByBrowser(timeoutMs = 8000): Promise<GeoResult | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 600_000, enableHighAccuracy: false },
    );
  });
}
