import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import type { MapItem, NoteCategory } from "@stickerboard/shared";
import { useMapPins } from "./useMapPins.js";
import { CategoryPicker } from "./CategoryPicker.js";
import { StickerComposer } from "./StickerComposer.js";
import { FilterBar } from "./FilterBar.js";
import { CATEGORIES } from "./categories.js";
import { locateByBrowser, locateByIp } from "./geolocate.js";
import { useAuth } from "../auth/AuthProvider.js";
import { toggleReaction } from "../api/client.js";
import { CLUSTER_OPTIONS, toFeatures, type ItemProps } from "./clusterModel.js";

// OpenFreeMap: free, no API key, open-source vector street tiles.
const STYLE = "https://tiles.openfreemap.org/styles/positron";

const ALL_CATS: NoteCategory[] = CATEGORIES.map((c) => c.id);

// Neutral world view, used only if we can't locate the user at all.
const FALLBACK_CENTER: [number, number] = [0, 25];

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
  const [reactErr, setReactErr] = useState<string | null>(null);
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeCats, setActiveCats] = useState<Set<NoteCategory>>(
    () => new Set(ALL_CATS),
  );

  function toggleCat(id: NoteCategory) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // All selected = show everything (incl. uncategorized); otherwise only the
  // chosen categories.
  const filteredPins = useMemo(() => {
    if (activeCats.size === ALL_CATS.length) return pins;
    return pins.filter(
      (p) => p.category !== undefined && activeCats.has(p.category),
    );
  }, [pins, activeCats]);

  // Center the map on the user: "ip" is silent/approximate (works on LAN http);
  // "gps" prompts for precise location and falls back to IP if blocked/denied.
  const centerOnUser = useCallback(async (mode: "ip" | "gps") => {
    setLocating(true);
    const result =
      mode === "gps"
        ? ((await locateByBrowser()) ?? (await locateByIp()))
        : await locateByIp();
    setLocating(false);
    if (result && mapRef.current) {
      mapRef.current.flyTo({
        center: [result.lng, result.lat],
        zoom: result.source === "gps" ? 14 : 11,
      });
    }
  }, []);

  function flyTo(item: MapItem) {
    mapRef.current?.flyTo({
      center: [item.lng, item.lat],
      zoom: Math.max(mapRef.current.getZoom(), 14),
    });
  }

  async function react(item: MapItem) {
    if (!isAuthed) {
      setReactErr("Sign in (top-right) to +1.");
      return;
    }
    setReactErr(null);
    try {
      const r = await toggleReaction(item.boardId);
      setSelected((s) =>
        s && s.id === item.id
          ? { ...s, reactions: r.reactions, reacted: r.reacted }
          : s,
      );
      void refresh();
    } catch (e) {
      setReactErr((e as Error).message);
    }
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
        el.style.background = item.category
          ? `var(--cat-${item.category})`
          : "var(--accent)";
        el.title = item.title;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setClusterList(null);
          setReactErr(null);
          setSelected(item);
        });
      }

      markersRef.current.push(
        new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map),
      );
    }
  }, []);

  // Create the map already centered on the user (no cross-world fly).
  // IP first for a fast initial center; GPS refines it if the user grants it.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let map: maplibregl.Map | null = null;

    void (async () => {
      const ip = await locateByIp();
      if (cancelled || !containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE,
        center: ip ? [ip.lng, ip.lat] : FALLBACK_CENTER,
        zoom: ip ? 12 : 2,
      });
      map.addControl(new maplibregl.NavigationControl({}), "top-left");
      map.on("load", () => {
        loadedRef.current = true;
        setMapReady(true);
        renderMarkers();
      });
      map.on("moveend", renderMarkers);
      // A click on empty map (not on a marker) starts a new sticker.
      map.on("click", (e) => {
        setCategory(null);
        setPending({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      });
      mapRef.current = map;

      // Refine to precise GPS if granted — a short move within the same area,
      // so it stays cheap (no world-crossing fly).
      void locateByBrowser().then((gps) => {
        if (!cancelled && gps && mapRef.current) {
          mapRef.current.easeTo({
            center: [gps.lng, gps.lat],
            zoom: 14,
            duration: 900,
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, [renderMarkers]);

  // Rebuild the cluster index whenever the (filtered) pin set changes.
  useEffect(() => {
    indexRef.current = new Supercluster<ItemProps>(CLUSTER_OPTIONS).load(
      toFeatures(filteredPins),
    );
    renderMarkers();
  }, [filteredPins, renderMarkers]);

  return (
    <div className="map-screen">
      <div ref={containerRef} className="map-canvas" />

      {!mapReady && (
        <div className="map-loading">
          <div className="map-loading__inner">
            <div className="spinner" />
            <span>Finding your location…</span>
          </div>
        </div>
      )}

      <FilterBar active={activeCats} onToggle={toggleCat} />

      <button
        className="map-locate"
        onClick={() => void centerOnUser("gps")}
        disabled={locating}
        title="Find my location"
        aria-label="Find my location"
      >
        {locating ? "…" : "📍"}
      </button>

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
                <div className="panel-list__row">
                  <span className="panel-list__title">{it.title}</span>
                  <span className="panel-list__count">👍 {it.reactions}</span>
                </div>
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
            <div
              className={`detail-sticker detail-sticker--${selected.category ?? "meet"}`}
            >
              <span className="tape" />
              <div className="detail-sticker__text">{selected.title}</div>
              {selected.body && (
                <div className="detail-sticker__sub">{selected.body}</div>
              )}
            </div>
            <div className="detail__meta">
              {expiryLabel(selected.expiresAt)}
            </div>
            <div className="detail__react">
              <button
                className={`react-btn ${selected.reacted ? "react-btn--on" : ""}`}
                onClick={() => react(selected)}
              >
                👍 <span>{selected.reactions}</span>
              </button>
              {reactErr && (
                <span className="detail__react-err">{reactErr}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {pending && !category && (
        <CategoryPicker
          onPick={setCategory}
          onClose={() => {
            setPending(null);
            setCategory(null);
          }}
        />
      )}

      {pending && category && (
        <StickerComposer
          lat={pending.lat}
          lng={pending.lng}
          category={category}
          onBack={() => setCategory(null)}
          onCreated={() => {
            setPending(null);
            setCategory(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
