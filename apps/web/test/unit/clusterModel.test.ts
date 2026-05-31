import { describe, it, expect } from "vitest";
import type { MapItem } from "@stickerboard/shared";
import {
  CLUSTER_OPTIONS,
  toFeature,
  toFeatures,
} from "../../src/map/clusterModel.js";

const item: MapItem = {
  id: "p1",
  boardId: "b1",
  kind: "note",
  title: "Coffee meet?",
  body: "Nero Cafe",
  lat: 40.7589,
  lng: -73.9851,
  visibility: "public",
  expiresAt: "2026-06-01T00:00:00.000Z",
};

describe("clusterModel", () => {
  it("maps an item to a GeoJSON point with [lng, lat] order", () => {
    const f = toFeature(item);
    expect(f.geometry.coordinates).toEqual([-73.9851, 40.7589]);
    expect(f.properties.item).toBe(item);
  });

  it("maps a list preserving order", () => {
    const fs = toFeatures([item, { ...item, id: "p2" }]);
    expect(fs).toHaveLength(2);
    expect(fs[1]!.properties.item.id).toBe("p2");
  });

  it("clusters only when more than 5 points are near (minPoints = 6)", () => {
    expect(CLUSTER_OPTIONS.minPoints).toBe(6);
  });
});
