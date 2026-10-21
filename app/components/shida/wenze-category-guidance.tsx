type Locale = "en" | "fr" | "ln" | "sw";
const hints = {
  en: {
    title: "Help buyers choose",
    fashion_clothing: "Describe the fit, material and colour. Add clear front and back photos. Use size options when you sell several sizes.",
    shoes_accessories: "For shoes, include the size system (for example EU), fit and material. Add photos of the sides and soles. Use shoe-size options if needed.",
    phones_electronics: "State the condition, brand, model and storage or configuration. Describe any defects and included accessories. Add photos of the actual item.",
    other: "Describe what the buyer will receive, its condition and useful measurements. Add clear photos of the actual item.",
    stock: "Choose one way to organise stock, such as size or storage. Put colour, material and other details in the description.",
  },
  fr: {
    title: "Aidez les clients à choisir",
    fashion_clothing: "Décrivez la coupe, la matière et la couleur. Ajoutez des photos nettes de face et de dos. Utilisez les options de taille si vous proposez plusieurs tailles.",
    shoes_accessories: "Pour les chaussures, précisez le système de pointure (par exemple EU), la coupe et la matière. Ajoutez des photos des côtés et des semelles. Utilisez les options de pointure si nécessaire.",
    phones_electronics: "Indiquez l’état, la marque, le modèle et le stockage ou la configuration. Décrivez les défauts et les accessoires inclus. Ajoutez des photos de l’article réel.",
    other: "Décrivez ce que le client recevra, l’état et les dimensions utiles. Ajoutez des photos nettes de l’article réel.",
    stock: "Choisissez une façon de répartir le stock, par taille ou stockage par exemple. Indiquez la couleur, la matière et les autres détails dans la description.",
  },
  ln: {
    title: "Salisa basombi bápona",
    fashion_clothing: "Limbolá ndenge elamba efandi, eloko esalemi na yango mpe langi. Bakisá bafɔtɔ ya liboso mpe ya nsima. Salelá ba taille soki ozali kotɛka bonene ndenge na ndenge.",
    shoes_accessories: "Mpo na sapato, lakisá pointure mpe système na yango (lokola EU), ndenge efandi mpe eloko esalemi na yango. Bakisá bafɔtɔ ya mipanzi mpe ya nse.",
    phones_electronics: "Lakisá état, marque, modèle mpe mémoire to configuration. Limbolá mabeba mpe accessoires oyo ezali na kati. Bakisá bafɔtɔ ya eloko yango.",
    other: "Limbolá eloko mosombi akozwa, état na yango mpe bonene ya ntina. Bakisá bafɔtɔ ya polele ya eloko yango.",
    stock: "Poná lolenge moko ya kokabola stock, lokola taille to mémoire. Tyá langi mpe makambo mosusu na ndimbola.",
  },
  sw: {
    title: "Wasaidie wanunuzi kuchagua",
    fashion_clothing: "Eleza namna nguo inavyokaa, kitambaa na rangi. Ongeza picha wazi za mbele na nyuma. Tumia chaguo za ukubwa ukiuza ukubwa tofauti.",
    shoes_accessories: "Kwa viatu, eleza mfumo wa ukubwa (kwa mfano EU), namna vinavyokaa na vifaa vilivyotumika. Ongeza picha za pembeni na nyayo. Tumia chaguo za ukubwa wa viatu inapohitajika.",
    phones_electronics: "Eleza hali, chapa, modeli na hifadhi au usanidi. Eleza kasoro na vifaa vinavyojumuishwa. Ongeza picha za bidhaa yenyewe.",
    other: "Eleza atakachopokea mnunuzi, hali yake na vipimo muhimu. Ongeza picha wazi za bidhaa yenyewe.",
    stock: "Chagua njia moja ya kupanga hesabu, kama ukubwa au hifadhi. Weka rangi, kitambaa na maelezo mengine katika maelezo ya bidhaa.",
  },
};
export function categoryVariantOptions(category: string) {
  category=category.split(":")[0];
  const all = ["size", "shoe_size", "storage", "volume", "option"];
  const first: Record<string, string> = {fashion_clothing:"size", shoes_accessories:"shoe_size", phones_electronics:"storage", beauty_cosmetics:"volume", food_drinks:"volume"};
  return first[category] ? [first[category], ...all.filter(value => value !== first[category])] : all;
}
export function variantExample(kind: string) {
  return ({size:"S, M, L",shoe_size:"EU 38, EU 39, EU 40",storage:"128 GB, 256 GB",volume:"250 ml, 500 ml"} as Record<string,string>)[kind] ?? "";
}
export function WenzeCategoryGuidance({category,locale,stock=false}:{category:string;locale:Locale;stock?:boolean}) {
  category=category.split(":")[0];
  const copy=hints[locale];
  const key=category in copy && ["fashion_clothing","shoes_accessories","phones_electronics"].includes(category) ? category as "fashion_clothing"|"shoes_accessories"|"phones_electronics" : "other";
  return <aside style={{gridColumn:"1 / -1",background:"#f0f2e8",padding:"1rem",borderRadius:8}} aria-label={copy.title}>
    <strong>{copy.title}</strong><p>{stock?copy.stock:copy[key]}</p>
  </aside>;
}
