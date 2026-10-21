import productCategories from "../../lib/wenze-product-categories.json";
import type { Locale } from "../../lib/i18n";
import type { WenzeProduct } from "../../types/shida-public";

const conditions = {
  new: ["New", "Neuf"],
  like_new: ["Like new", "Comme neuf"],
  used: ["Used", "D’occasion"],
  other: ["Other condition", "Autre état"],
} as const;
const optionLabels = {
  size: ["Sizes", "Tailles"],
  shoe_size: ["Shoe sizes", "Pointures"],
  storage: ["Storage", "Stockage"],
  volume: ["Volumes", "Volumes"],
  option: ["Options", "Options"],
} as const;

/** Only public, supplied facts; missing legacy attributes remain absent. */
export function WenzeProductFacts({ product, locale, compact = false }: {
  product: WenzeProduct; locale: Locale; compact?: boolean;
}) {
  const category=productCategories.find(row=>row.code===product.category)?.labels[locale];
  const index = locale === "fr" ? 1 : 0;
  const condition = conditions[product.condition as keyof typeof conditions]?.[index];
  const optionLabel = optionLabels[product.variant_type as keyof typeof optionLabels]?.[index];
  const options = [...new Set(product.variants.filter(v => v.is_available &&
    (v.available_stock == null || v.available_stock > 0)).map(v => v.label.trim()).filter(Boolean))];
  if (!category && !condition && (!optionLabel || !options.length)) return null;
  const visible = compact ? options.slice(0, 3) : options;
  return <dl className="wzp-product-facts">
    {category&&<div><dt>{locale==="fr"?"Catégorie":"Category"}</dt><dd>{category}</dd></div>}
    {condition && <div><dt>{locale === "fr" ? "État" : "Condition"}</dt><dd>{condition}</dd></div>}
    {optionLabel && options.length > 0 && <div><dt>{optionLabel}</dt><dd>{visible.join(" · ")}{visible.length < options.length ? ` +${options.length - visible.length}` : ""}</dd></div>}
  </dl>;
}
