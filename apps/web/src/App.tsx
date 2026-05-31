import { useMemo, useState } from "react";
import { AuthBar } from "./auth/AuthBar.js";
import { useAuth } from "./auth/AuthProvider.js";
import { MapView } from "./map/MapView.js";
import { WallView } from "./wall/WallView.js";
import { createMockWallApi } from "./wall/mockApi.js";
import { ThemeSwitcher } from "./theme/ThemeSwitcher.js";

type View = { kind: "map" } | { kind: "wall"; handle: string };

/**
 * App shell: a header over the map, with a wall view that overlays the map
 * (so the map keeps its location/state while you visit walls).
 */
export function App() {
  const { user } = useAuth();
  const myHandle = user?.username ?? null;
  // Mock wall backend for now — same interface the real API will implement.
  const wallApi = useMemo(() => createMockWallApi(myHandle), [myHandle]);
  const [view, setView] = useState<View>({ kind: "map" });

  return (
    <div className="app">
      <header className="appbar">
        <div className="appbar__inner">
          <div className="brand">
            Sticker<span className="dot">●</span>Board
          </div>
          <div className="appbar__actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setView({ kind: "wall", handle: myHandle ?? "demo_friend" })
              }
            >
              🧱 Walls
            </button>
            <ThemeSwitcher />
            <AuthBar />
          </div>
        </div>
      </header>
      <main className="app__main">
        <MapView />
        {view.kind === "wall" && (
          <WallView
            api={wallApi}
            handle={view.handle}
            myHandle={myHandle}
            onExit={() => setView({ kind: "map" })}
            onVisit={(handle) => setView({ kind: "wall", handle })}
          />
        )}
      </main>
    </div>
  );
}
