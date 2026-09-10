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
