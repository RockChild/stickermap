import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapItem } from "@stickerboard/shared";
import { useMapPins } from "./useMapPins.js";
import { NoteComposer } from "./NoteComposer.js";
import { useAuth } from "../auth/AuthProvider.js";

// Keyless demo style — no API token needed.
const STYLE = "https://demotiles.maplibre.org/style.json";

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}

function popupHtml(p: MapItem): string {
  const expires = p.expiresAt
    ? new Date(p.expiresAt).toLocaleString()
    : "never";
  const body = p.body ? `<br/>${escapeHtml(p.body)}` : "";
  return `<strong>${escapeHtml(p.title)}</strong>${body}<br/><small>expires: ${expires}</small>`;
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const { pins, refresh } = useMapPins();
  const { isAuthed } = useAuth();
  const [pending, setPending] = useState<{ lng: number; lat: number } | null>(
    null,
  );

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [-73.9851, 40.7589],
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl({}), "top-left");
    map.on("click", (e) =>
      setPending({ lng: e.lngLat.lng, lat: e.lngLat.lat }),
    );
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-render markers whenever the pin set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    for (const p of pins) {
      const el = document.createElement("div");
      el.className = "map-pin-dot";
      el.title = p.title;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(popupHtml(p)))
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [pins]);

  return (
    <div className="map-screen">
      <div ref={containerRef} className="map-canvas" />
      {!pending && (
        <div className="map-hint">
          {isAuthed
            ? "Tap anywhere on the map to drop a note."
            : "Sign in (top-right), then tap the map to drop a note."}
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
