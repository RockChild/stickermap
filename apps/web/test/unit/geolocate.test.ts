import { describe, it, expect } from "vitest";
import { parseIpGeo } from "../../src/map/geolocate.js";

describe("parseIpGeo", () => {
  it("reads latitude/longitude from a successful response", () => {
    expect(
      parseIpGeo({ success: true, latitude: 52.52, longitude: 13.405 }),
    ).toEqual({ lat: 52.52, lng: 13.405, source: "ip" });
  });

  it("returns null when the service reports failure", () => {
    expect(parseIpGeo({ success: false })).toBeNull();
  });

  it("returns null on missing or non-numeric coords", () => {
    expect(parseIpGeo({ latitude: "52", longitude: 13 })).toBeNull();
    expect(parseIpGeo(null)).toBeNull();
    expect(parseIpGeo("nope")).toBeNull();
  });
});
