import { useState } from "react";
import { AuthBar } from "./auth/AuthBar.js";
import { useAuth } from "./auth/AuthProvider.js";
import { MapView } from "./map/MapView.js";
import { WallView } from "./wall/WallView.js";
import { httpWallApi } from "./wall/httpApi.js";
import { ThemeSwitcher } from "./theme/ThemeSwitcher.js";

type View = { kind: "map" } | { kind: "wall"; handle: string };

/**
 * App shell: a header over the map, with a wall view that overlays the map
 * (so the map keeps its location/state while you visit walls).
 */
export function App() {
  const { user } = useAuth();
  const myHandle = user?.username ?? null;
  const [view, setView] = useState<View>({ kind: "map" });

  function openWalls() {
    if (myHandle) {
      setView({ kind: "wall", handle: myHandle });
      return;
    }
    const h = window.prompt(
      "Sign in for your own wall — or visit which @handle?",
    );
    if (h) setView({ kind: "wall", handle: h.trim().replace(/^@/, "") });
  }

  return (
    <div className="app">
      <header className="appbar">
        <div className="appbar__inner">
          <div className="brand">
            Sticker<span className="dot">●</span>Board
          </div>
          <div className="appbar__actions">
            <button className="btn btn-ghost btn-sm" onClick={openWalls}>
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
            api={httpWallApi}
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
