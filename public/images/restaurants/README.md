# Seller sign-in illustration

`malewa-comptoir.png` is the approved, unchanged standalone v2 artwork supplied
from `seller-design-concepts-v2/assets/`. It is decorative generated artwork,
not a photograph of a real seller and not a screenshot of the interface.
Original: 1122 × 1402, opaque ivory, 2,014,102 bytes.

Web derivatives use the existing Sharp dependency, aspect ratio preserved,
WebP quality 80, no cropping or regenerated content:

- `malewa-comptoir-480.webp`: 480 × 600, 50,176 bytes.
- `malewa-comptoir-800.webp`: 800 × 1000, 110,380 bytes.

The seller sign-in `<picture>` selects these only at widths >=900px, using a
responsive `srcset` and sizes. Smaller screens use an inline pixel and omit the
decorative picture: they do not download the source or either derivative.
Authenticated screens do not render this picture. Empty alternative text keeps
its decorative words out of the functional sign-in instructions.

No new image dependency, external image service or runtime generation is added.

## Public discovery: La frise peinte

Superseded by La table partagée below. These older assets are retained for
historical reference but are no longer rendered or downloaded by discovery.

`liboko-kwanga-banner.png` is the unchanged approved standalone source from
`restaurant-liboko-concepts/assets/` (2172 × 724; 2,910,937 bytes).
The supplied assets README explicitly supersedes mockup extraction: this source
was previously derived using image generation and is not a pixel-identical
mockup crop. No artwork was generated or redesigned during implementation.

Sharp WebP quality 78 derivatives (crop coordinates in source pixels):

| Family | Left, top, width, height | Output widths | File bytes |
| --- | --- | --- | --- |
| mobile | 300, 120, 1600, 410 | 480 / 960 | 20,956 / 65,132 |
| tablet | 0, 130, 2172, 396 | 960 / 1440 | 51,398 / 95,434 |
| desktop | 0, 230, 2172, 245 | 960 / 1440 / 2172 | 33,076 / 61,630 / 104,640 |

Reproduce each using the installed Sharp: `sharp(source).extract(rect).resize(width).webp({quality:78}).toFile(destination)`.
The discovery picture uses media sources at <=600px / <=900px and width
descriptors with sizes=100vw. The master PNG is never referenced by the page.
Empty alt marks it decorative; it never replaces an establishment image.

## Public discovery: La table partagée (current)

`table-partagee.png` is the unchanged supplied `03-la-table-partagee.png` from
`restaurant-marketplace-scenes/`: 2170 × 725, opaque cream, 2,826,021 bytes.
No regeneration, transparency conversion, extraction or crop was applied.
Existing Sharp produces complete proportional WebP variants at quality 80:

| File | Dimensions | Bytes |
| --- | --- | ---: |
| table-partagee-480.webp | 480 × 160 | 25,882 |
| table-partagee-720.webp | 720 × 241 | 52,974 |
| table-partagee-1080.webp | 1080 × 361 | 110,572 |
| table-partagee-1440.webp | 1440 × 481 | 181,970 |

Reproduction: `sharp(source).resize(width).webp({quality:80}).toFile(destination)`.
The picture reserves the original aspect ratio, uses width descriptors with
`sizes="(max-width: 720px) 100vw, 720px"`, and is centered at a maximum width of
720px. Height scales naturally, with contain rather than cover. Phones see the
same complete illustration. Empty alt is intentional. Neither master PNG nor
superseded liboko assets are requested by this component.
