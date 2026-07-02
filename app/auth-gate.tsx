"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";

const DEFAULT_USER = "bsoper";
const DEFAULT_PASSWORD_HASH =
  "5488f793f9558f2b8a27271938ceeb236868855862922c0df451dae84cd568e3";

async function sha256(value: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAuthenticated(localStorage.getItem("upkeep-sso-auth") === "ok");
    setReady(true);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const expectedUser = process.env.NEXT_PUBLIC_BASIC_AUTH_USER || DEFAULT_USER;
    const expectedHash =
      process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD_SHA256 || DEFAULT_PASSWORD_HASH;
    const enteredHash = await sha256(password);

    if (userName.trim().toLowerCase() === expectedUser.toLowerCase() && enteredHash === expectedHash) {
      localStorage.setItem("upkeep-sso-auth", "ok");
      setAuthenticated(true);
      setError("");
      return;
    }

    setError("Sign-in failed. Check the username and password.");
  }

  if (!ready) {
    return <div className="auth-screen" />;
  }

  if (authenticated) {
    return children;
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-mark">
          <LockKeyhole size={22} />
        </div>
        <div>
          <p className="eyebrow">Welch Packaging</p>
          <h1>UpKeep SSO Upgrade</h1>
        </div>
        <label className="auth-field">
          <span>Username</span>
          <input
            autoComplete="username"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="action primary auth-submit" type="submit">
          Sign In
        </button>
      </form>
    </main>
  );
}
