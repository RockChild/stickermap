import type { Coordinate, Place } from "./types.js";
import type { GeocodeResult, Geocoder } from "./location.js";

// Deterministic admin centroids for tests (approximate, coarse on purpose).
export const BERLIN: Place = {
  type: "city",
  name: "Berlin",
  centroid: { lat: 52.52, lng: 13.405 },
};

export const GERMANY: Place = {
  type: "country",
  name: "Germany",
  centroid: { lat: 51.1657, lng: 10.4515 },
};

// A precise point near the Brandenburg Gate — what a device GPS might report.
export const PRECISE_BERLIN: Coordinate = { lat: 52.516275, lng: 13.377704 };

/** A fake geocoder that always resolves to Berlin / Germany. */
export const berlinGeocoder: Geocoder = (): GeocodeResult => ({
  city: BERLIN,
  country: GERMANY,
});

/** A fake geocoder with no city resolution (e.g. mid-ocean). */
export const countryOnlyGeocoder: Geocoder = (): GeocodeResult => ({
  country: GERMANY,
});
