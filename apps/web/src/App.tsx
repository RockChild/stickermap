import { AuthBar } from "./auth/AuthBar.js";
import { MapView } from "./map/MapView.js";
import { ThemeSwitcher } from "./theme/ThemeSwitcher.js";

/**
 * App shell: a header (brand · theme switcher · auth) over the map.
 * Drop a note in one browser; it appears in another via the polled public feed.
 */
export function App() {
  return (
    <div className="app">
      <header className="appbar">
        <div className="appbar__inner">
          <div className="brand">
            Sticker<span className="dot">●</span>Board
          </div>
          <AuthBar />
          <ThemeSwitcher />
        </div>
      </header>
      <main className="app__main">
        <MapView />
      </main>
    </div>
  );
}
