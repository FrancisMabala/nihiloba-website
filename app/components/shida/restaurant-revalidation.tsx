"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RestaurantRevalidation() {
  const router = useRouter();
  useEffect(() => {
    // Re-read the backend after history restoration or a WhatsApp handoff.
    // No local clock-based availability/expiry policy or account state.
    const restored = (event: PageTransitionEvent) => { if (event.persisted) router.refresh(); };
    const visible = () => { if (document.visibilityState === "visible") router.refresh(); };
    window.addEventListener("pageshow", restored);
    document.addEventListener("visibilitychange", visible);
    return () => { window.removeEventListener("pageshow", restored); document.removeEventListener("visibilitychange", visible); };
  }, [router]);
  return null;
}
