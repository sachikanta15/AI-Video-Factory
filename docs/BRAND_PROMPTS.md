# Brand asset prompts

Copy-paste prompts for generating the Katha Sutra avatar and banner in an external image model (Gemini, ChatGPT,
Midjourney, Ideogram). The checked-in sources are `.data/brand/avatar.svg` and `.data/brand/banner.svg`; these prompts
reproduce the same design for anyone without the SVG pipeline.

**Generate the art without text.** Image models mangle Devanagari — matras detach, `सूत्र` turns into nonsense. Ask for
empty sky and add the wordmark afterwards in Figma, Canva, or by editing the SVG. The banner prompt below reserves that
space explicitly.

Style pack: `watercolor` paper-collage. Palette: `#355070` indigo, `#6d597a` mauve, `#b56576` rose, `#e56b6f` coral,
`#eaac8b` apricot, `#fdf6ec` cream, plus gold thread `#f4c98b`.

## Avatar — 1:1, 800×800

> A square profile emblem for a Hindi mythology storytelling channel, hand-painted paper-collage style with watercolour
> texture and slightly rough torn-paper edges. Centred composition, bold simple shapes that stay readable at 48 pixels.
> A large apricot sun disc (`#eaac8b` with a coral `#e56b6f` lower half) sits centred, half-submerged in a flat
> horizontal band of mauve river water (`#b56576` over `#6d597a`), with a few thin cream ripple strokes. Behind it, a
> deep indigo night sky (`#355070` to `#2b425d`). A single thin gold thread (`#f4c98b`) arcs across the sun, makes one
> loop to the right, and trails down into the water ending in a small knot. Two or three soft cream cloud dashes in the
> upper sky. Flat vector-like shapes, limited warm palette, no gradients mesh, generous empty margin around the emblem.
> No text, no letters, no numerals, no watermark, no border, no frame.

Set aspect ratio **1:1**. Instagram and YouTube both crop avatars to a circle, so keep the sun centred and nothing
important in the corners.

## Banner — 16:9, 2560×1440

> A wide channel banner, panoramic 16:9, for a Hindi mythology storytelling channel. Hand-painted paper-collage style,
> watercolour texture, torn-paper edges, limited warm palette. Composition, left to right: a warm apricot-and-coral
> setting sun sitting on the horizon at the far left; a broad empty indigo sky band across the upper middle; a paler
> cream-and-apricot rising sun on the horizon at the far right. A single thin gold thread arcs high between the two suns,
> passing above the empty sky band. Below the horizon, a calm river fills the lower third in flat mauve and rose bands
> (`#b56576`, `#ab5c72`, `#9e5468`) with thin cream ripple strokes and soft reflections under each sun. In the river on
> the right, small in frame, a woman in a coral sari with a gold border stands waist-deep facing the rising sun, one arm
> raised holding a small woven offering basket with a few fruit. A sandy bank in muted tan runs along the bottom edge.
> The entire central band — roughly 60% of the width and the middle 30% of the height — is calm, uncluttered indigo sky,
> deliberately left empty for a wordmark. Flat vector-like shapes, no text, no letters, no numerals, no watermark, no
> border.

Set aspect ratio **16:9**, then resize to 2560×1440. YouTube shows only the centre **1546×423** on mobile and most
desktops: keep the wordmark inside that band, and treat everything outside it as decoration that may be cropped.

## Wordmark to composite afterwards

| Element | Text | Notes |
| --- | --- | --- |
| Display name | `कथा सूत्र` | cream `#fdf6ec`, heavy weight, centred, upper half of the safe band |
| Tagline | `पुरानी कथाएँ, साफ़ जवाब — हर बात के लिए स्रोत` | apricot `#eaac8b`, ~24% of the display-name size, below it |

Use a Devanagari typeface with a real bold weight — Kohinoor Devanagari, ITF Devanagari, or Noto Serif Devanagari.
Watch the `ू` descender in `सूत्र`: it hangs below the baseline and will collide with the tagline if the two are set
too close.

## Iteration prompts

- Figure too small or unreadable: "make the figure larger and simplify to a bold silhouette, remove small details like
  the face and the basket weave".
- Text space crowded: "clear the central band completely, move all elements to the left and right thirds".
- Too photographic: "flatten everything, remove all soft shading and gradients, keep only flat shapes and paper texture".
- Wrong mood: "warmer, dusk not night, raise the sky to apricot near the horizon".

## If you must generate the text

Ask for the exact string and expect to fix it:

> Include the text `कथा सूत्र` in large cream Devanagari lettering centred in the upper sky band, and beneath it in
> smaller apricot lettering `पुरानी कथाएँ, साफ़ जवाब — हर बात के लिए स्रोत`. Both lines must be spelled exactly as
> written, with correct Devanagari matras.

Check every matra afterwards. Regenerating is usually faster than repairing.
