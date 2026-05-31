export interface IpLocation {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

/** Parse an ip-api.com response into an IpLocation (or null if unusable). */
export function parseIpApi(data: unknown): IpLocation | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.status !== "success") return null;
  if (typeof d.lat !== "number" || typeof d.lon !== "number") return null;
  const loc: IpLocation = { lat: d.lat, lng: d.lon };
  if (typeof d.city === "string") loc.city = d.city;
  if (typeof d.country === "string") loc.country = d.country;
  return loc;
}

/**
 * Approximate location from the caller's public IP, looked up server-to-server
 * (no browser CORS). With no IP argument the provider geolocates this server's
 * public IP — which on a dev LAN is the same network as the user.
 * NOTE: in production, pass the real client IP instead.
 */
export async function lookupIpLocation(): Promise<IpLocation | null> {
  try {
    const res = await fetch(
      "http://ip-api.com/json/?fields=status,lat,lon,city,country",
    );
    if (!res.ok) return null;
    return parseIpApi(await res.json());
  } catch {
    return null;
  }
}
