"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Calls the site's API. A 401 sends the person to the sign-in page. */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) {
    if (window.location.pathname !== "/login") window.location.assign("/login");
    throw new ApiError(data.error ?? "Sign in to continue.", 401);
  }
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong. Try again.", res.status);
  return data as T;
}

/**
 * Loads a resource and keeps it fresh: reloads when the tab regains focus
 * and, when `pollMs` is set, on a timer while the tab is visible.
 */
export function useLoad<T>(path: string, pollMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paused = useRef(false);

  const reload = useCallback(async () => {
    try {
      const next = await api<T>(path);
      if (!paused.current) setData(next);
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status !== 401) setError(e.message);
    }
  }, [path]);

  useEffect(() => {
    let alive = true;
    const run = () => {
      if (alive && document.visibilityState === "visible") void reload();
    };
    run();
    window.addEventListener("focus", run);
    const timer = pollMs ? window.setInterval(run, pollMs) : undefined;
    return () => {
      alive = false;
      window.removeEventListener("focus", run);
      if (timer) window.clearInterval(timer);
    };
  }, [reload, pollMs]);

  /** Stops background reloads from overwriting what a person is typing. */
  const pause = useCallback((on: boolean) => {
    paused.current = on;
  }, []);

  return { data, setData, error, reload, pause };
}
