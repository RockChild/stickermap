import { useState } from "react";
import { useAuth } from "./AuthProvider.js";

export function AuthBar() {
  const { isAuthed, user, login, signup, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (isAuthed) {
    return (
      <div className="authbar">
        <span className="authbar__who">{user ? user.email : "Signed in"}</span>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>
    );
  }

  async function run(fn: (e: string, p: string) => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn(email, password);
      setOpen(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authbar">
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Sign in
      </button>

      {open && (
        <>
          <div className="authbar__backdrop" onClick={() => setOpen(false)} />
          <div className="authbar__pop">
            <input
              className="field"
              placeholder="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="field"
              placeholder="password (8+)"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="authbar__actions">
              <button
                className="btn btn-ghost btn-sm"
                disabled={busy}
                onClick={() => run(login)}
              >
                Sign in
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() => run(signup)}
              >
                Sign up
              </button>
            </div>
            {err && <div className="authbar__err">{err}</div>}
          </div>
        </>
      )}
    </div>
  );
}
