import {marketplaceDiscoveryCopy} from "../../lib/marketplace-discovery-copy";
import productCategories from "../../lib/wenze-product-categories.json";
import type { ServiceLocale as Locale } from "../../lib/services-i18n";
import type { WenzeProduct } from "../../types/shida-public";

/** Only public, supplied facts; missing legacy attributes remain absent. */
export function WenzeProductFacts({ product, locale, compact = false }: {
  product: WenzeProduct; locale: Locale; compact?: boolean;
}) {
  const category=productCategories.find(row=>row.code===product.category)?.labels[locale];
  const t=marketplaceDiscoveryCopy[locale];
  const conditions={new:t.new,like_new:t.like_new,used:t.used,other:t.other};
  const optionLabels={size:locale==="en"?"Sizes":locale==="fr"?"Tailles":t.size,shoe_size:t.shoe_size,storage:t.storage,volume:t.volume,option:t.option};
  const condition = conditions[product.condition as keyof typeof conditions];
  const optionLabel = optionLabels[product.variant_type as keyof typeof optionLabels];
  const options = [...new Set(product.variants.filter(v => v.is_available &&
    (v.available_stock == null || v.available_stock > 0)).map(v => v.label.trim()).filter(Boolean))];
  if (!category && !condition && (!optionLabel || !options.length)) return null;
  const visible = compact ? options.slice(0, 3) : options;
  return <dl className="wzp-product-facts">
    {category&&<div><dt>{t.category}</dt><dd>{category}</dd></div>}
    {condition && <div><dt>{t.condition}</dt><dd>{condition}</dd></div>}
    {optionLabel && options.length > 0 && <div><dt>{optionLabel}</dt><dd>{visible.join(" · ")}{visible.length < options.length ? ` +${options.length - visible.length}` : ""}</dd></div>}
  </dl>;
}
