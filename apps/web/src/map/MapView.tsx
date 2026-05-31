import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import type { MapItem } from "@stickerboard/shared";
import { useMapPins } from "./useMapPins.js";
import { NoteComposer } from "./NoteComposer.js";
import { useAuth } from "../auth/AuthProvider.js";
import { CLUSTER_OPTIONS, toFeatures, type ItemProps } from "./clusterModel.js";

// Keyless demo style — no API token needed.
const STYLE = "https://demotiles.maplibre.org/style.json";

function expiryLabel(iso: string | null): string {
  return iso ? `Expires ${new Date(iso).toLocaleString()}` : "Permanent";
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const indexRef = useRef<Supercluster<ItemProps> | null>(null);
  const loadedRef = useRef(false);

  const { pins, refresh } = useMapPins();
  const { isAuthed } = useAuth();

  const [pending, setPending] = useState<{ lng: number; lat: number } | null>(
    null,
  );
  const [selected, setSelected] = useState<MapItem | null>(null);
  const [clusterList, setClusterList] = useState<MapItem[] | null>(null);

  function flyTo(item: MapItem) {
    mapRef.current?.flyTo({
      center: [item.lng, item.lat],
      zoom: Math.max(mapRef.current.getZoom(), 14),
    });
  }

  // Re-render markers for the current viewport from the cluster index.
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const index = indexRef.current;
    if (!map || !index || !loadedRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const b = map.getBounds();
    const bbox: [number, number, number, number] = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ];
    const zoom = Math.round(map.getZoom());

    for (const f of index.getClusters(bbox, zoom)) {
      const [lng, lat] = f.geometry.coordinates as [number, number];
      const props = f.properties;
      const el = document.createElement("div");

      if ("cluster" in props && props.cluster) {
        const clusterId = props.cluster_id;
        el.className = "map-cluster";
        el.textContent = String(props.point_count);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const leaves = index.getLeaves(clusterId, Infinity);
          setSelected(null);
          setClusterList(leaves.map((l) => l.properties.item));
        });
      } else {
        const item = (props as ItemProps).item;
        el.className = "map-pin-dot";
        el.title = item.title;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setClusterList(null);
          setSelected(item);
        });
      }

      markersRef.current.push(
        new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map),
      );
    }
  }, []);

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [-73.985, 40.758],
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl({}), "top-left");
    map.on("load", () => {
      loadedRef.current = true;
      renderMarkers();
    });
    map.on("moveend", renderMarkers);
    // A click on empty map (not on a marker) starts a new note.
    map.on("click", (e) =>
      setPending({ lng: e.lngLat.lng, lat: e.lngLat.lat }),
    );
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, [renderMarkers]);

  // Rebuild the cluster index whenever the pin set changes.
  useEffect(() => {
    indexRef.current = new Supercluster<ItemProps>(CLUSTER_OPTIONS).load(
      toFeatures(pins),
    );
    renderMarkers();
  }, [pins, renderMarkers]);

  return (
    <div className="map-screen">
      <div ref={containerRef} className="map-canvas" />

      {!pending && !selected && !clusterList && (
        <div className="map-hint">
          {isAuthed
            ? "Tap the map to drop a note."
            : "Sign in (top-right), then tap the map to drop a note."}
        </div>
      )}

      {clusterList && (
        <div className="panel-overlay">
          <div className="panel-overlay__head">
            {clusterList.length} notes here
            <button
              className="panel-overlay__x"
              onClick={() => setClusterList(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="panel-list">
            {clusterList.map((it) => (
              <button
                key={it.id}
                className="panel-list__item"
                onClick={() => {
                  setClusterList(null);
                  setSelected(it);
                  flyTo(it);
                }}
              >
                <div className="panel-list__title">{it.title}</div>
                {it.body && <div className="panel-list__sub">{it.body}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="panel-overlay">
          <div className="panel-overlay__head">
            Note
            <button
              className="panel-overlay__x"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="detail">
            <div className="detail__title">{selected.title}</div>
            {selected.body && (
              <div className="detail__body">{selected.body}</div>
            )}
            <div className="detail__meta">
              {expiryLabel(selected.expiresAt)}
            </div>
          </div>
        </div>
      )}

      {pending && (
        <NoteComposer
          lat={pending.lat}
          lng={pending.lng}
          onClose={() => setPending(null)}
          onCreated={() => {
            setPending(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
