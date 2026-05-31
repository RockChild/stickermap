import { useCallback, useEffect, useState } from "react";
import type { MapItem } from "@stickerboard/shared";
import { fetchPins } from "../api/client.js";

/**
 * Fetches the public map feed and polls it, so a note dropped in one browser
 * appears in another within `pollMs`.
 */
export function useMapPins(pollMs = 4000) {
  const [pins, setPins] = useState<MapItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      setPins(await fetchPins());
    } catch {
      /* transient network error — keep the last known pins */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { pins, refresh };
}
