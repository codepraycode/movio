# Open Graph image — `public/og.jpg`

The social share card (WhatsApp, X, LinkedIn, iMessage…). It is referenced from
`index.html` and must live at `public/og.jpg`.

## Specs

- **Size:** 1200 × 630 px (the standard OG ratio). Export as JPG (smaller, fine
  for photographic/gradient cards).
- **Safe area:** keep important content ~80px from every edge — some apps crop.
- **Readable as a thumbnail:** large type, high contrast, one clear focal point.
- **Brand:** Movio green. Primary `#16A34A`, deep `#0F7A52`, light wash `#ECFDF5`,
  ink `#0A0A0A`, white `#FFFFFF`. Font: Inter (Bold/ExtraBold).
- **Hero the logomark:** the Movio "M" drawn as a route with a glowing GPS node at
  its junction. It's in `public/favicon.svg` — reuse that exact mark.

## Recommended approach (sharpest result)

Image generators mangle text and logos. For a crisp card:

1. Generate **only the background/illustration** with the prompt below.
2. In Figma/Canva, lay the real `favicon.svg` logomark + the headline text on top
   as vectors. That keeps the logo and copy razor-sharp.

Suggested overlay text:
> **Movio** (with mark) · "Know exactly when your FUTA shuttle is coming."
> Small line: "Live tracking + tap-to-board · Take the 3-min survey"

## Image-generation prompt

```
A clean, modern, inviting Open Graph banner, 1200x630, for "Movio" — a smart
campus shuttle app for a Nigerian university (FUTA, Akure). Left two-thirds:
soft mint-to-white gradient background (#ECFDF5 to #FFFFFF) with a faint dotted
route grid and a smooth curving green route line (#16A34A) winding across, with
small glowing GPS pin nodes along it and one larger pulsing node. Right third:
a floating smartphone UI card with a rounded 2rem radius and a soft green glow,
showing a live shuttle map — a green route, a bus marker, and an "Arriving in 3
min" chip. Bright, optimistic daytime mood, lots of negative space, premium and
trustworthy product-marketing aesthetic, flat vector illustration style, subtle
depth and soft shadows, no text, no words, no logos. Color palette restricted to
greens (#16A34A, #0F7A52, #34D399), white, and near-black ink.
```

### If you want the generator to include text anyway

Append: `Leave the entire left half visually quiet and uncluttered as empty space
reserved for a headline.` Then still add the real text/logo yourself for sharpness.

## After exporting

- Save to `public/og.jpg` (exactly that path/name).
- The absolute URLs in `index.html` already point at `https://movioapp.vercel.app`.
  Update them only if the deployed domain changes.
- Validate with Facebook Sharing Debugger, X Card Validator, or
  https://www.opengraph.xyz — they also force a re-scrape of the cache.
