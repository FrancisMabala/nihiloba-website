import type { Locale } from "../../lib/i18n";
import type { PublicJobPromotion } from "../../types/shida-public";

export function JobPromotionLabel({ locale, promotion, applicationDeadline, now }: { locale: Locale; promotion: PublicJobPromotion; applicationDeadline: string | null; now: number }) {
  const promotionEnd = new Date(promotion.ends_at).getTime();
  const deadlineEnd = applicationDeadline ? new Date(`${applicationDeadline}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(promotionEnd) || promotionEnd < now || deadlineEnd < now) return null;
  return <span className="job-promotion-label">{locale === "fr" ? "À la une" : "Featured"}</span>;
}
