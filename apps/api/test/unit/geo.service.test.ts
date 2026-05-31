import { describe, it, expect } from "vitest";
import { parseIpApi } from "../../src/geo/service.js";

describe("parseIpApi", () => {
  it("reads lat/lon (and optional city/country) on success", () => {
    expect(
      parseIpApi({
        status: "success",
        lat: 50.43,
        lon: 16.66,
        city: "Klodzko",
        country: "Poland",
      }),
    ).toEqual({ lat: 50.43, lng: 16.66, city: "Klodzko", country: "Poland" });
  });

  it("returns null when status is not success", () => {
    expect(parseIpApi({ status: "fail" })).toBeNull();
  });

  it("returns null on missing/non-numeric coords or junk", () => {
    expect(parseIpApi({ status: "success", lat: "x", lon: 1 })).toBeNull();
    expect(parseIpApi(null)).toBeNull();
    expect(parseIpApi("nope")).toBeNull();
  });
});
