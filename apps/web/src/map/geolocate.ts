export interface GeoResult {
  lat: number;
  lng: number;
  source: "gps" | "ip";
}

/** Parse a response from ipwho.is into a GeoResult (or null if unusable). */
export function parseIpGeo(data: unknown): GeoResult | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.success === false) return null;
  if (typeof d.latitude === "number" && typeof d.longitude === "number") {
    return { lat: d.latitude, lng: d.longitude, source: "ip" };
  }
  return null;
}

/**
 * Approximate location from the network's public IP. Works on any origin
 * (incl. LAN http), no permission prompt. Sends the caller's IP to a free
 * third-party service (ipwho.is).
 */
export async function locateByIp(): Promise<GeoResult | null> {
  try {
    const res = await fetch("https://ipwho.is/");
    if (!res.ok) return null;
    return parseIpGeo(await res.json());
  } catch {
    return null;
  }
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
