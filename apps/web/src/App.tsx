import { useTheme } from "./theme/ThemeProvider.js";
import { ThemeSwitcher } from "./theme/ThemeSwitcher.js";
import { THEME_META } from "./theme/themes.js";

/**
 * Theme test harness: a showcase of core components so all three themes can be
 * compared live via the cycle button. This is a scaffold for evaluating the
 * design system — the real Map/Editor screens come later.
 */
export function App() {
  const { theme } = useTheme();
  const meta = THEME_META[theme];

  return (
    <>
      <header className="appbar">
        <div className="appbar__inner">
          <div className="brand">
            Sticker<span className="dot">●</span>Board
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="wrap">
        <h1 className="hero">{meta.label}</h1>
        <p className="lede">
          {meta.tagline}. Tap the button in the top-right to cycle themes —
          every element below re-themes from shared design tokens.
        </p>

        <section>
          <p className="sec-title">Buttons &amp; status</p>
          <div className="panel">
            <div className="row">
              <button className="btn btn-primary">New board</button>
              <button className="btn btn-ghost">Cancel</button>
              <button className="btn btn-accent2">Save &amp; publish</button>
              <span className="pill">Premium</span>
            </div>
          </div>
        </section>

        <section>
          <p className="sec-title">Stickers</p>
          <div className="panel">
            <div className="row" style={{ gap: 28, alignItems: "flex-start" }}>
              <div className="sticker">
                <span className="tape" />
                Buy oat milk 🥛
              </div>
              <div className="sticker s2">
                Sprint demo
                <br />
                Friday 4pm
              </div>
              <div className="sticker s3">
                <span className="tape" />
                Call grandma ❤️
              </div>
            </div>
            <p className="note">Hover a sticker — it straightens and lifts.</p>
          </div>
        </section>

        <section>
          <p className="sec-title">Map pins &amp; components</p>
          <div className="grid">
            <div className="panel">
              <div className="pinwrap">
                <div className="pin pulse" />
                <div className="pin cluster">12</div>
                <div className="pin priv" />
              </div>
              <p className="note">
                Public · cluster · private (anonymous dot).
              </p>
            </div>
            <div className="panel">
              <div className="board-card">
                <div className="thumb">
                  <div className="mini" />
                  <div className="mini b" />
                </div>
                <div className="meta">
                  <div className="t">Coffee Ideas ☕</div>
                  <div className="s">Berlin · 8 stickers · public</div>
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="toolbar" style={{ marginBottom: 18 }}>
                <button className="tool active" title="Sticker">
                  🗒️
                </button>
                <button className="tool" title="Crayon">
                  🖍️
                </button>
                <button className="tool" title="Emoji">
                  😀
                </button>
              </div>
              <div className="seg">
                <button aria-pressed="true">Public</button>
                <button aria-pressed="false">Unlisted</button>
                <button aria-pressed="false">Private</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
