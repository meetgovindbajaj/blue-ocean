"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    localStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);
  const lastSentKeyRef = useRef<string | null>(null);

  const search = searchParams?.toString() || "";

  useEffect(() => {
    if (!pathname) return;

    const sessionId = getSessionId();
    const query = search;

    // Avoid duplicate sends caused by re-renders / unstable searchParams identity.
    const sendKey = query ? `${pathname}?${query}` : pathname;
    if (lastSentKeyRef.current === sendKey) return;
    lastSentKeyRef.current = sendKey;

    // Keep entityId stable by using pathname only (avoids splitting page stats by query params)
    const entityId = pathname;

    const metadata: Record<string, unknown> = {
      page: pathname,
      pageQuery: query,
      previousPage: previousPathRef.current || undefined,
      // Real external referrer (if any); API will fall back to page URL otherwise
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
    };

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "page_view",
        entityType: "page",
        entityId,
        entitySlug: pathname,
        entityName: typeof document !== "undefined" ? document.title : pathname,
        sessionId,
        metadata,
      }),
    }).catch(() => {
      // Best-effort only
    });

    previousPathRef.current = pathname;
  }, [pathname, search]);

  return null;
}
