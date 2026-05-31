import type { Coordinate, LocationType, Place } from "./types.js";

/**
 * Resolves a precise coordinate to candidate administrative places.
 * Implemented by a real geocoding service in production; mocked in tests.
 * `city` may be absent (e.g. open ocean, disputed area); `country` is required.
 */
export interface GeocodeResult {
  city?: Place;
  country: Place;
}

export type Geocoder = (coord: Coordinate) => GeocodeResult;

export interface ReduceOptions {
  type: LocationType;
  /**
   * Explicit, consented opt-in to retain the user's precise coordinate.
   * Defaults to false. When false, the precise point is discarded entirely.
   */
  allowPrecise?: boolean;
}

export interface ReducedLocation {
  type: LocationType;
  name: string;
  /** Administrative centroid — safe to publish. */
  centroid: Coordinate;
  /** Present ONLY when allowPrecise === true. */
  precise?: Coordinate;
}

/**
 * Privacy reduction: given a precise coordinate, return only the
 * city/country centroid. The precise point is dropped unless the caller
 * explicitly opts in via `allowPrecise`.
 */
export function reduceLocation(
  coord: Coordinate,
  geocoder: Geocoder,
  options: ReduceOptions,
): ReducedLocation {
  const resolved = geocoder(coord);

  const place =
    options.type === "city" ? resolved.city : resolved.country;

  if (!place) {
    throw new Error(
      `Cannot reduce to "city": geocoder resolved no city for the given coordinate.`,
    );
  }

  const reduced: ReducedLocation = {
    type: place.type,
    name: place.name,
    centroid: place.centroid,
  };

  // The precise point is dropped entirely unless explicitly opted in.
  if (options.allowPrecise === true) {
    reduced.precise = coord;
  }

  return reduced;
}
