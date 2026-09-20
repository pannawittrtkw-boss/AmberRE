"use client";

import { useEffect } from "react";

// Registers the service worker that enables PWA installability (see
// public/sw.js). Runs once on the client, quietly no-ops in browsers
// without support or during local http-only dev over a non-localhost host.
export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the site still works fully without a service worker.
      });
    }
  }, []);

  return null;
}
