"use client";

export function RestaurantRetry({ label }: { label: string }) {
  // Retry the exact current route, including filters/menu page, without echoing
  // a potentially privacy-redacted legacy slug into the server-rendered markup.
  return <button type="button" className="restaurant-link" onClick={() => window.location.reload()}>{label}</button>;
}
