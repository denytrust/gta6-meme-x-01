# gta6-meme-x-01 — LEONIDA AIRLINES boarding pass

## The joke
A boarding pass for a flight that took 13 years. Picked up in Los Santos on
Sep 17, 2013 (GTA V launch), arriving in Vice City on Nov 19, 2026 — stamped
**DELAYED 13 YEARS**. Flight V → VI, seat 13A, gate VI, class "13-YEAR WAIT".
Jason & Lucia already boarded. 4,811 days in the air. Non-refundable, no
refunds on waiting. And the fare was **PAID BY MY AI AGENT with a bounty it
won on make.fun** — the make.fun ghost holds its magenta star coin next to
the make.fun wordmark.

## Why this document (originality)
The top 10 are all bureaucratic documents, but none of them is a boarding
pass: rank 1 is a rental-car receipt, rank 2 a funeral bill, rank 3 a parking
citation, rank 5 an obituary, rank 6 a power bill, rank 7 a prison release,
rank 8 a library overdue notice, rank 10 a bail certificate. A boarding pass
is a different document with its own visual language (route, flight/seat/gate,
barcode, stub) and its "delayed" punchline is the most natural fit for a
13-year wait — a flight that was supposed to take hours took 13 years.

## How it is made
- `main.ts` (Node 22, standard library only) draws everything with code: its
  own PNG encoder, a DejaVu font atlas (`font-atlas.bin`, rendered locally
  with PIL at 4x supersampling + LANCZOS), the real make.fun logo
  (`logo.bin`, a transparent-background cutout of the logo the user sent —
  see v5), a drawn plane, a deterministic barcode, and a magenta
  gradient frame.
- No downloaded images, no network. The logo is the actual make.fun logo
  pixels (as a binary asset read at runtime); the plane, barcode and
  wordmark are drawn, not pasted.
- `main.ts` writes `/output/meme.png` and `/output/POST.json` (byte-for-byte
  the repo's POST.json). A local `./out/` copy is attempted inside try/catch
  because the grader's repo is read-only.

## Render (current: v5)
- meme.png: 1024x1024 PNG, 146,105 bytes, sha256
  `8ca776db5cea3f68d2e7b8448a65d71e5b6bd08b8df77111f492414d5faaeb80`
  (two runs byte-identical; sandbox simulation in a read-only directory
  exits 0 and writes /output/meme.png + /output/POST.json correctly,
  byte-identical to the normal runs).
- Verified at full size, at 480x480 (the judge's size), and as a close
  crop of the badge: the ghost is now the REAL make.fun logo (white ghost,
  thick black outline, diamond eyes, pink coin with white star, small
  white ball below it), sitting cleanly inside the white circle with no
  magenta halo and no jagged edges; the rotated stamp still reads as a
  real rubber stamp; the tracked caps read as deliberate, professional
  letterspacing; the magenta band content is vertically balanced; the
  frame is magenta→deep-magenta (no violet); the ghost + make.fun are
  unmistakable at judge size; no overlap or cut-off anywhere, picture
  stays clean.
- POST.json is currently the starter placeholder; the parent replaces it with
  the real X post URL after posting.

## v5 (real make.fun logo, 23 Nov 2026 ~01:10 WITA)
The user said the code-drawn ghost looked wrong ("Logo makefun nya aneh,
ganti saja sesuai asli yang kukirim tadi") — so v5 replaces the code-drawn
ghost with the ACTUAL logo pixels, not another approximation. Everything
else is v4, byte-identical in concept (boarding pass, stamp, jokes, band
text, colours, tracking, rotation).

### How the cutout was built (build_logo.py, not part of the entry)
- Source: the logo the user sent, `~/workspace/user/files/139807_0_i718.jpg`
  (400x400, solid magenta background (197,28,131)).
- Key finding: the pink coin's fill is the SAME magenta as the background
  (sampled (191,31,131)/(201,26,129) inside the coin, distance 5-7 from the
  background), so a plain colour-distance key would have erased the coin
  and left a white hole where it belongs. Instead the outside background
  was flood-filled away from the image border through background-coloured
  pixels only — the coin stays opaque because its black outline encloses
  it. Edge pixels (within 2px of the outside) get a smooth alpha from
  their colour distance to the background, so the cutout is anti-aliased.
- The RGBA was cropped tightly to the ghost + coin + ball (302x254) and
  resampled to its exact display size, 200x169, with premultiplied alpha
  (LANCZOS), so no magenta halo bleeds into the edge pixels.
- `logo.bin`: 200x169 RGBA, 135,208 bytes (8-byte header: width, height,
  uint32 LE, then width*height*4 RGBA bytes). It is a separate binary
  asset in the repo, read at runtime like `font-atlas.bin` — no JPEG
  decoder, no base64 image data in main.ts.
- Placement: blitted at (70, 776), centred on the white badge circle
  (170, 860) with ~12px of room on each side; the white circle shows
  through the cutout's transparent background around the ghost.

### main.ts changes
- Deleted `drawGhost`, `sparkle` and `star5` (only used by the ghost).
- Added `loadLogo()` (reads logo.bin, same URL/fallback pattern as
  `loadAtlas`) and `blitLogo(dx, dy)` (alpha-blit onto the RGB canvas,
  same blend math as `drawText`).
- The band call site changed from `drawGhost(170, 860, 168)` to
  `blitLogo(70, 776)`. Nothing else in main.ts changed.
- v5 render: meme.png 1024x1024 PNG, 146,105 bytes, sha256
  `8ca776db5cea3f68d2e7b8448a65d71e5b6bd08b8df77111f492414d5faaeb80`
  (two runs byte-identical; read-only-directory simulation exits 0 and
  writes /output/meme.png + /output/POST.json correctly, byte-identical
  to the normal runs).
- Verified at full size, at 480x480, and as a close crop of the badge:
  the ghost is the real logo (white ghost, bold black outline, diamond
  eyes, pink coin with white star upper-right, small white ball below
  it, two-lobe hem with centre notch, left-edge notch), it sits cleanly
  inside the white circle on the magenta band with no magenta rectangle
  halo and no jagged edges, and everything else is identical to v4.

## v4 (refero-design audit + polish, 23 Nov 2026 ~01:00 WITA)
Standing instruction (user 23 Nov ~00:54 WITA): apply the refero-design
skill to ALL visual work. This revision runs the skill's workflow on v3:
research (top-4 document memes re-viewed: rank 1 receipt, rank 3 citation,
rank 4 Leonida Mart), reference lock, anti-slop audit, decision ledger,
then targeted fixes only. Concept, jokes, ghost, stamp text and colours'
roles are unchanged.

### Reference lock (refero-design)
```text
Primary reference/direction: the boarding-pass document meme itself,
grounded in the top-4 document memes (rank 1 receipt, rank 3 citation,
rank 4 customer display). A bureaucratic document whose "delayed"
punchline is the joke; the boarding pass is the one document type the
top 10 does not use.
Preserve: document format (navy airline header, cream paper body,
magenta make.fun band); the DELAYED 13 YEARS stamp as the dominant
element; the make.fun ghost + magenta wordmark pill as the brand carrier;
the 5 joke beats (BAGGAGE, MEAL, MILES EARNED: 0, 4,811 DAYS, NO REFUNDS).
Borrow only: rank 1's rotated rubber stamp (the stamp is slammed on at
an angle, not placed by a grid) — one detail, not its layout or text.
Role rules: magenta = make.fun brand only (band, ghost coin, wordmark);
red = delay/overdue semantic only (stamp, arrow, 4,811 DAYS); navy =
airline authority (header, city names, field values); gold = airline
branding accent (BOARDING PASS, GTA VI • LEONIDA); cream = paper.
Media strategy: everything drawn in code (ghost, plane, barcode);
no image data, no pasted assets.
Reject: indigo/violet anywhere (not a brand colour); generic card
layouts; calm-editorial serif autopilot (the serif here is a formal
document's voice, not a decorative choice); emoji icons; decorative
stripes; averaging the top-4 references into a safe middle.
Token commitments: navy #16233F header, cream #FDFCF7 paper, magenta
#D61B60 band, red #C62828 stamp, gold #FFC107 airline accent.
```

### Audit of v3 (anti-slop checklist + quality gate)
PASS: no indigo/violet in the document itself; no cards; no emoji; no
decorative stripes; light mode (cream paper); serif justified (a formal
document SHOULD be serif); colours are role-justified (see lock); 4+
typography levels (48 stamp / 40 cities / 36 header / 32 band headline /
22 values / 20-12 small); ghost + make.fun unmistakable; brand test and
identity test pass (hide the band and it is still unmistakably a GTA 6
boarding pass; hide the header and the ghost + magenta still sell make.fun).
WEAK — 4 findings, all fixed below:
(a) ALL CAPS letter-spacing MISSING. The atlas renderer advanced glyphs
by exactly their advance width — zero tracking anywhere. The typography
guide makes 0.06-0.10em tracking MANDATORY on ALL CAPS and 0.01-0.02em
on small text. Every caps string in the meme (labels, stamp, band copy)
was cramped.
(b) NO VISUAL TENSION. The stamp was a perfectly straight, perfectly
centred rectangle in its own row — placed by a grid, not slammed on.
Rank 1's stamp is rotated and overlapping; that rotation is the tension.
(c) OUTER FRAME GRADIENT ends in purple/violet (#6A1B9A). That is the
#1 AI-slop tell and purple is not a make.fun brand colour. The frame
must stay inside the magenta family.
(d) MAGENTA BAND has dead space: the sell copy sits 28px below the band
top but 74px above the band bottom — top-heavy, 46px of empty magenta
at the bottom.

### Decision ledger
| Decision | Source | Source rule / role | Why |
|----------|--------|--------------------|-----|
| Add tracking param to drawText/textWidth/drawTextCentered/drawTextRight; 0.08em on ALL CAPS display, 0.06em on serif-22 caps values, 0.02em on small sans | typography.md §8 | ALL CAPS tracking 0.06-0.10em MANDATORY; small text 0.01-0.02em REQUIRED | (a) caps were cramped; 0.06em on the 22px values keeps "SERVED 2013, STILL WARM" inside the 964px divider (ends 956) |
| Rotate stamp +4° (left high, right low, like rank 1) and shift +20px right; stampY 312→316 | anti-ai-slop.md (layout tension, break the grid); rank 1 reference | one element breaks the grid, not everything | (b) the straight centred stamp was the most grid-placed element; rotation makes it read as a real rubber stamp; corners stay 9px clear of dates/labels |
| Frame gradient bottom #6A1B9A → #AD144C (MAGENTA_DARK); remove unused PURPLE constant | anti-ai-slop.md #1, color.md §9 | NEVER indigo/violet unless the brand requires it | (c) purple is not a make.fun brand colour; magenta→deep-magenta is a same-hue darkening, intentional not default |
| Shift magenta-band sell block (ghost + copy) down 22px | color.md §3, anti-ai-slop.md (whitespace as a design element) | accent band content balanced, not top-heavy | (d) top margin 28px vs bottom 74px; after shift both ≈50px |
| No change to concept, jokes, ghost, stamp text, hierarchy, or layout grid | reference lock | preserve the primary direction's signature traits | audit found these sound; the fixes are polish, not a redesign |

### Bug found while verifying v4 (fixed in-session)
The first v4 run rendered only a few letters per string (42,623 bytes):
tracking made `pen` fractional (e.g. 2.4px), and a fractional index
into a Uint8Array silently writes nothing — only glyphs whose pen
happened to be an integer rendered. The rotated stamp text was
unaffected (its destination pixels are integers). Fix: `drawText`
rounds the blit x to an integer pixel (`Math.round(pen + g.bx)`) while
keeping the fractional pen for accumulation, so there is no drift.
Verified in isolation first (a /tmp test script, not part of the
entry), then in main.ts. After the fix the first run was 118,205
bytes with every glyph present.
- v4 render: meme.png 1024x1024 PNG, 118,205 bytes, sha256
  `5b056c4e76b1770b732da6569217f1f22b5b5b5a6b8bffe1db5c63bdc6880711`
  (two runs byte-identical; read-only-directory simulation exits 0 and
  writes /output/meme.png + /output/POST.json correctly, byte-identical
  to the normal runs).
- Verified at full size, at 480x480, and as a close crop of the stamp:
  rotated stamp reads as a real rubber stamp, ~9px clear of dates and
  labels; tracked caps look deliberate; band content vertically
  balanced; frame magenta→deep-magenta, no violet; ghost + make.fun
  unmistakable at judge size; no overlap or cut-off, picture clean.

## v2 (revision, 22 Nov 2026 ~23:20 WITA)
Parent review found v1 clean and original but thin on jokes vs rank 1-4
(rank 1 has 5 funny line items, rank 4 a timeline + sunset + 5 line items).
Three new joke beats added, nothing removed:
- New second field row (same label/value pattern as the row above):
  BAGGAGE "13 YEARS OF HYPE" and MEAL "SERVED 2013, STILL WARM".
  Two fields only, not three: the full-strength values are too wide for
  three serif-22 columns in 904px — the first attempt at three fields
  overlapped badly (measured: "13 YEARS OF HYPE" 334px, "SERVED 2013,
  STILL WARM" 486px, "0 DESTINATIONS" 304px; total 1,124px > 904px).
- Third beat under the barcode: the caption changed from "V→VI • 4811"
  to "MILES EARNED: 0" (the flight flew 13 years and earned zero miles).
- Plane icon redrawn cleaner: three shapes only (thicker fuselage with a
  pointed nose, one swept main wing below, one swept tail fin above). The
  old fourth shape (a tailplane drooping at the rear) muddied the silhouette.
- Layout rebalanced to fit the new row: stamp 318→312 (80px tall),
  details row 418, divider 538, joke lines 552/582, barcode 616 (44px
  tall), bottom band 696 (300px tall). Ghost, wordmark, stamp, colours and
  the core concept are unchanged.
- v2 render: meme.png 1024x1024 PNG, 112,670 bytes, sha256
  `dd4521ffb6429937df0d65c93e509cd96b53a7278dfa367bb285283e9a047529`
  (two runs byte-identical; read-only-directory simulation exits 0 and
  writes /output/meme.png + /output/POST.json correctly).
- Verified at full size and at 480x480: the three new beats read instantly,
  no overlap or cut-off anywhere, the plane reads as a plane, the ghost +
  make.fun are unmistakable, picture stays clean.

## v3 (ghost redraw, 23 Nov 2026 ~00:12 WITA)
The user uploaded the real make.fun logo and approved redrawing the ghost
to match it. The v2 ghost was close but wrong in five ways; all fixed:
- Outline: was a thin 1.07x scale (~3.5px). Now a fixed bold 7px outline
  (t = 7), even all around, like the real logo. The outline pass no longer
  scales the shape around its centre (that made the outline uneven:
  ~12px at the top, ~2px at the bottom of the head); it draws the same
  shape expanded by t.
- Head: wider, r = h*0.36 (was 0.30) — the real logo's ghost is almost as
  wide as it is tall; the v2 ghost was tall and narrow.
- Coin: bigger (r*0.48, was r*0.40) and moved up-right (coinY = cy - h*0.10,
  was cy + h*0.10) so it sits upper-right like the real logo, overlapping
  the body's right edge. Star inside enlarged to r*0.30.
- White ball: the v2 "hand" was small and high. Now a proper small white
  ball below the coin (ballY = cy + h*0.24, radius r*0.26, 4px outline),
  straddling the body's right edge like the real logo.
- Hem: was 3 bumps (centre bump). Now 2 shallow lobes with a centre notch
  (the real logo's hem): each lobe is a circle whose chord at bodyBot is
  bumpW wide and which protrudes 14px below it (lobeR computed from the
  chord, (hw^2 + p^2) / (2p)). Plus a small notch bump on the body's left
  edge at 65% height (radius 9), the fold the real logo has there.
- Eyes: moved up to the upper-middle of the head (cy - h*0.15, was
  cy - h*0.08), still the diamond sparkle shape — the real logo's eyes
  sit just above the head's centre.
- The white badge circle grew 108 → 112 so the wider ghost's hem outline
  stays inside it. Nothing else changed: boarding pass, stamp, joke beats,
  wordmark, colours and layout are all v2.
- The ghost is still drawn entirely with code (shapes/paths) — the uploaded
  logo image was only looked at as a reference; no image data was embedded
  or copied into the repo or into main.ts.
- v3 render: meme.png 1024x1024 PNG, 112,726 bytes, sha256
  `9629a83c72ae63d12a386717be550df2d3060b5058807f5b79ddf0d641fcb3d4`
  (two runs byte-identical; read-only-directory simulation exits 0 and
  writes /output/meme.png + /output/POST.json correctly).
- Verified at full size, at 480x480, and as a close crop of the badge:
  the ghost now matches the real logo (bold outline, big pink coin + star
  upper-right, white ball below it, diamond eyes, two-lobe hem with centre
  notch, left-edge notch), it is instantly recognisable as the make.fun
  mascot at judge size, no overlap or cut-off anywhere, picture stays clean.
