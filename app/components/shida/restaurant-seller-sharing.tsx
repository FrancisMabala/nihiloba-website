"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { request } from "../../lib/restaurant-seller-browser";
import { validShare } from "../../lib/restaurant-seller-contract";
import { sellerChrome, restaurantText } from "../../lib/restaurant-seller-copy";
import type { RestaurantLocale } from "../../services/shida/restaurants-client";

export function RestaurantSharing({ establishment, binding, locale, onFailure }: { establishment: string; binding: string; locale: RestaurantLocale; onFailure: (error: unknown) => void }) {
 const [link, setLink] = useState<{ public_url: string; qr_content: string; destination: string } | null>(null), [busy, setBusy] = useState(false);
 const alive = useRef(false), canvas = useRef<HTMLCanvasElement>(null); const t = sellerChrome[locale];
 useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
 useEffect(() => { if (link?.destination === "menu" && canvas.current) void QRCode.toCanvas(canvas.current, link.qr_content, { width: 256, margin: 4, errorCorrectionLevel: "M" }).catch(onFailure); }, [link, onFailure]);
 async function prepare(destination: "restaurant" | "menu") {
  if (busy) return; setBusy(true); setLink(null);
  try { const value = await request(`personal/restaurants/${encodeURIComponent(establishment)}/links/${destination}`, { method: "POST" }, binding); if (!validShare(value, establishment, destination)) throw new Error("invalid_share"); if (alive.current) setLink(value); }
  catch (error) { if (alive.current) onFailure(error); }
  finally { if (alive.current) setBusy(false); }
 }
 return <section className="rst-card"><h2>{t.sharing}</h2><p>{t.shareNote}</p><div className="rst-actions"><button className="button button-secondary" disabled={busy} onClick={() => void prepare("restaurant")}>{t.restaurantLink}</button><button className="button button-secondary" disabled={busy} onClick={() => void prepare("menu")}>{t.menuLink}</button></div>{busy && <p role="status">{restaurantText(locale, "loading")}</p>}{link && <><a href={link.public_url} target="_blank" rel="noopener noreferrer">{t.openLink}</a>{link.destination === "menu" && <canvas className="rst-qr" ref={canvas} role="img" aria-label={t.qr}>{t.qr}</canvas>}</>}</section>;
}
