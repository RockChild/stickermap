import type { MapItem } from "@stickerboard/shared";
import type Supercluster from "supercluster";

/** Each clustered point carries its full MapItem so leaves can rebuild a list. */
export interface ItemProps {
  item: MapItem;
}

export function toFeature(item: MapItem): Supercluster.PointFeature<ItemProps> {
  return {
    type: "Feature",
    properties: { item },
    geometry: { type: "Point", coordinates: [item.lng, item.lat] },
  };
}

export function toFeatures(
  items: MapItem[],
): Supercluster.PointFeature<ItemProps>[] {
  return items.map(toFeature);
}

// Clustering knobs (see 10_reactions_lifetimes_clustering.md):
// cluster only when MORE than 5 points fall within ~100px.
export const CLUSTER_OPTIONS = {
  radius: 60,
  maxZoom: 16,
  minPoints: 6,
} as const;
