import { describe, it, expect } from "vitest";
import { reduceLocation } from "../src/location.js";
import {
  BERLIN,
  GERMANY,
  PRECISE_BERLIN,
  berlinGeocoder,
  countryOnlyGeocoder,
} from "../src/location.fixtures.js";

describe("reduceLocation — privacy reduction", () => {
  it("reduces a precise coordinate to the city centroid", () => {
    const result = reduceLocation(PRECISE_BERLIN, berlinGeocoder, {
      type: "city",
    });
    expect(result).toMatchObject({
      type: "city",
      name: "Berlin",
      centroid: BERLIN.centroid,
    });
  });

  it("reduces to the country centroid when type is country", () => {
    const result = reduceLocation(PRECISE_BERLIN, berlinGeocoder, {
      type: "country",
    });
    expect(result).toMatchObject({
      type: "country",
      name: "Germany",
      centroid: GERMANY.centroid,
    });
  });

  it("never returns the precise point without explicit opt-in", () => {
    const result = reduceLocation(PRECISE_BERLIN, berlinGeocoder, {
      type: "city",
    });
    expect(result.precise).toBeUndefined();
    // The published centroid must not equal the user's precise coordinate.
    expect(result.centroid).not.toEqual(PRECISE_BERLIN);
  });

  it("retains the precise point only when allowPrecise is true", () => {
    const result = reduceLocation(PRECISE_BERLIN, berlinGeocoder, {
      type: "city",
      allowPrecise: true,
    });
    expect(result.precise).toEqual(PRECISE_BERLIN);
  });

  it("throws when city is requested but the geocoder resolves none", () => {
    expect(() =>
      reduceLocation(PRECISE_BERLIN, countryOnlyGeocoder, { type: "city" }),
    ).toThrow(/city/i);
  });
});
