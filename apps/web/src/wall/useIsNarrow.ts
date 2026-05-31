import { useEffect, useState } from "react";
import { WALL_NARROW_PX } from "./layout.js";

const QUERY = `(max-width: ${WALL_NARROW_PX - 1}px)`;

/** True on narrow (mobile) viewports, where the wall uses the stream. */
export function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const handler = () => setNarrow(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return narrow;
}
