// Shared domain types, mirroring 02_api_and_data_models.md.
// Kept framework-free so both apps/api and apps/web can import them.

export type LocationType = "city" | "country";
export type Visibility = "public" | "private" | "unlisted";
export type Role = "owner" | "editor" | "viewer";
export type StickerType = "note" | "image" | "emoji" | "shape";

export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * An administrative place plus its centroid. The centroid is the
 * city/country center — NEVER the user's precise location.
 */
export interface Place {
  type: LocationType;
  name: string;
  centroid: Coordinate;
}

export interface Board {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  visibility: Visibility;
  location?: Place;
  isPublished: boolean;
  version: number;
  premiumFeatures: { crayonEnabled: boolean; collabEnabled: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface Sticker {
  id: string;
  boardId: string;
  type: StickerType;
  content: string;
  position: { x: number; y: number };
  style: { color: string; rotation: number; size: "small" | "medium" | "large" };
  createdBy: string;
  createdAt: string;
}

export interface MapPin {
  id: string;
  boardId: string;
  locationType: LocationType;
  locationName: string;
  centroid: Coordinate;
  publishedAt: string;
}
