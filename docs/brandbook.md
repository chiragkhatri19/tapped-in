# docs/brandbook.md  ·  tappd in (v5 — refined neo-brutalism)

> The design language. Supersedes v4 and the color + visual sections of `TappedIn_Brand_Book_v2.docx`.
> Direction: **refined neo-brutalism** — keep the attitude, drop the hostility.
> Palette: **VOLT** — ink + bone cream + electric cobalt + acid yellow, on a navy-black dark mode.

---

## 0. the thesis (v5)

v4 proved the attitude works: thick borders, hard shadows, bold flat color, mono numbers. It is memorable and unmistakably not-AI. But raw attitude alone plateaus. v4 applied the *same* border, the *same* shadow, the *same* radius to everything. That uniformity is its own kind of slop — every box shouting at the same volume, nothing leading the eye.

**v5 keeps every brutalist signature and adds the layer that separates a senior designer from a generator: hierarchy, optical correction, and restraint.** The look is still stamped-on and structural. But now it breathes, it has depth tiers, the corners are rounded with intent, and one element on each screen is clearly the loudest.

> Brutalism is the skeleton. Taste is the 8% on top that you only notice when it's missing.

The test stays: screenshot any screen, post it with no caption. If nobody wonders what app it is, redo it.

---

## 1. THE TASTE GAP — senior designer vs AI (read this first)

This is the spine of v5. Every rule below exists to close one of these gaps. The research is consistent: AI tools nail the *production layer* (variants, spacing, polish) and produce "synthetic genericism" — a flood of competent, identical, forgettable screens. What they miss is below.

| dimension | what AI / junior ships | what a senior ships | our rule |
|---|---|---|---|
| **volume** | every element equally bold | one clear hero per screen, everything else supports | depth tiers §3, one loud thing §1.1 |
| **radius** | one radius on everything, or random | concentric nesting (inner = outer − padding) | §4 |
| **shadows** | uniform, or harsh/muddy | layered, intentional, depth = importance | §3 |
| **alignment** | mathematically centered | optically centered (adjusted by eye) | §6 |
| **color** | rainbow, decorative | 2–3 colors, one dominant + one accent, applied with purpose | §2 |
| **type** | everything bold | weight discipline — medium is the default, bold is an event | §5 |
| **motion** | linear, uniform, or none | eased, physical, duration scales with distance | §7 |
| **deviation** | perfectly consistent (= sterile) | one deliberate rule-break that signals a human chose it | §1.2 |

### 1.1 one loud thing per screen
Decide the single most important element before you style anything. It gets the biggest shadow (`shadowLg`), the boldest type, and the accent color. Everything else steps down. If two things are equally loud, neither is.

On the home dashboard that is the **DailyMacroSummary** (calories eaten). It carries `shadowLg`. The water widget, streak, and micro panel are secondary (`shadow`). Chips and badges are tertiary (`shadowSm`).

### 1.2 the deliberate deviation
A design that is 100% systematic reads as machine-made. Pick *one* intentional break per surface and own it: a heading that runs slightly oversized into the margin, a yellow marker-stroke under a section title, a number set 20% larger than the grid wants, an accent that lands somewhere unexpected. One. Not five. The break has to look chosen, not sloppy.

---

## 2. COLOR — "VOLT" (refined)

Restrict to these. **2 to 3 bold colors max per screen.** ~80% of every screen is ink + cream (light) or cream + navy (dark). Color is applied with purpose, never for decoration. If you're using a color to fill space, delete it.

### 2.1 core tokens

| token | light | dark | role |
|---|---|---|---|
| background | `#F2ECDE` | `#0D0F1C` | bone cream / deep navy-black |
| foreground (ink) | `#111111` | `#F2ECDE` | text, **borders**, **shadows** |
| card | `#FBF7EC` | `#131626` | surfaces |
| muted (fill/track) | `#E7E0CE` | `#1A1D2E` | pressed, disabled, progress tracks |
| mutedForeground | `#4A453B` | `#9BA3C0` | secondary text — warm taupe (light) / cool blue-grey (dark) |
| primary (hero) | `#2B3AFF` | `#3B4AFF` | CTAs, active/selected. the *only* CTA color |
| onPrimary | `#FFFFFF` | `#FFFFFF` | text on cobalt |
| highlight (pop) | `#E8FF00` | `#E8FF00` | the reveal, "why?" chips, milestones, marker-strokes. text on it is always `#111111` |
| alert | `#FF3B2F` | `#FF5247` | strikethrough, over-target, destructive |

### 2.2 why dark mode went navy (v5 change)
v4 dark was warm near-black (`#161412`). It was fine, but warm-on-warm flattens — the cream borders and shadows didn't separate from the surface dramatically enough. **Navy-black (`#0D0F1C`) makes the cream borders and acid yellow read like they're lit from within.** Cool ground + warm/electric accents is the highest-contrast pairing we can ship without going to pure black (pure black + bright borders causes halation/vibration on OLED). The navy also reads more "instrument panel," which fits an evidence-first product.

### 2.3 color temperature = free depth
Warm colors advance toward the eye; cool colors recede. We exploit this so the UI has depth even before shadows: cool navy/cobalt grounds sit *back*, warm cream and acid yellow come *forward*. Practical rule: the thing you want tapped should be the warmest or most saturated element in its neighborhood. Never put two high-saturation colors adjacent and equal — one has to dominate.

### 2.4 section accent family (wayfinding only)
Each app section keeps a signature accent for orientation, used on dots, bars, and one hero element — never as a second CTA:
`pop` acid yellow · `pink` magenta (fat) · `teal` (science/evidence) · `orange` (workout/carbs) · `violet` (coach) · `blue` cobalt (= primary).

Rules:
- **Cobalt is the only CTA / active color.** Acid yellow is the *rare* pop. If yellow stops feeling like an event, it's overused.
- **No gradients. No blur. No frosted glass.** The signature shadow stays hard and zero-blur. (This is the one place we do *not* soften — see §3.)
- Warm cream, not white. Warm ink `#111`, not pure `#000`.

---

## 3. DEPTH — the shadow hierarchy (v5 core change)

v4 had `shadow` (5) and `shadowSm` (3) and used them somewhat interchangeably. v5 makes depth carry meaning. The shadow stays a **solid offset block, zero blur** (our signature — cross-platform via `BrutalShadow`). What changed is that *offset distance now encodes importance*, like elevation in a physical sense.

| token | offset | use | meaning |
|---|---|---|---|
| `shadowLg` | `8px` | the one hero card per screen | "look here first" |
| `shadow` | `5px` | standard secondary cards | "this is a real surface" |
| `shadowSm` | `3px` | chips, badges, small interactive rows | "tap-sized" |

Rules:
- **Exactly one `shadowLg` per screen.** More than one and the hierarchy collapses back into v4 flatness.
- Shadow color is always `foreground` (ink in light, cream in dark). Never a tinted or blurred shadow.
- **Press = press into the shadow:** on press the face translates by the offset and the shadow vanishes. This is the tactile signature. `BrutalButton` / `BrutalChip` do it; match it on any new pressable.
- Larger offset wants slightly more surrounding padding so the block has room to land. A `shadowLg` card sits in ≥20px screen margin.

---

## 4. RADIUS — rounded with intent (v5 core change)

v4 was `4px` everywhere ("squared, barely softened"). The user's instinct was right: a little more roundness reads as crafted and human without going soft. v5 introduces a **radius scale with concentric nesting**, the single most senior-coded detail in the whole book.

| token | value | use |
|---|---|---|
| `radius` | `10px` | buttons, chips, inputs, small elements |
| `radiusLg` | `14px` | card-level surfaces (`BrutalBox` default) |
| `radiusPill` | `100px` | badges, streak/met pills, dots, the FAB |

### 4.1 the nesting law (this is the taste detail)
When a rounded element sits inside another, their corners must be **concentric**, not parallel. The math:

```
innerRadius = outerRadius − padding
```

A card at `radiusLg` (14) with 16px padding holds children whose radius is ≤ `14 − 16` → clamp to the next step down (`radius` 10). A pill inside a card stays a pill. **Never put two equal radii at different nesting levels** — the gap between them will look optically wrong (thicker at the corners) and is the fastest way to look amateur. When in doubt, child radius < parent radius.

### 4.2 borders stay sharp-minded
Roundness softens the silhouette; the `3px` border keeps it brutalist. The two together (rounded corner + thick hard border + hard offset shadow) is the v5 signature shape. Squared corners are now reserved for deliberately raw moments only (e.g. the progress-bar fills, which stay `2px` for a technical look).

---

## 5. TYPOGRAPHY — weight discipline

Trio unchanged. What changes in v5 is **restraint**: bold is an event, not a default. AI over-bolds because bold reads "important" in isolation; a senior keeps most chrome at medium so that the few bold moments actually land.

| role | font | weight | notes |
|---|---|---|---|
| display / headings | **Bricolage Grotesque** | **700, no italic** | lowercase, tight tracking `-0.5` to `-1`. Never italic — italic reads thin and is the #1 tell of AI-generated UI |
| body / UI | **Hanken Grotesk** | **500 default**, 400 long-form | medium is the workhorse, not bold |
| buttons / CTAs | Hanken Grotesk | 700 | bold earns its place here |
| micro-labels | Geist Mono | 600 | UPPERCASE, +1 tracking, section headers/tags |
| every number | **Geist Mono** | 500/600 | calories, weight, macros, %, scores, days — always |

### type scale (stick to it)
`11 · 12 · 14 · 16 · 18 · 24 · 32 · 52`. The jump from body (16/18) to display (24/32) to hero number (52) is deliberate and large — modest in-between sizes muddy the hierarchy. Numbers are ALWAYS Geist Mono, even inline ("2g protein"). This is the "we did the math" signal and the reveal's payoff.

Rules:
- **Headings: lowercase, no italic, heavy.** `F.displayBold` at 24–42px. Italic is explicitly banned — it makes 700-weight glyphs read 20% thinner and loses the brutalist punch.
- `fontStyle: 'italic'` is permitted only on bodyReg/bodyMed for genuine editorial italic (coach cues, quoted notes, captions). Never on headings.
- Micro-labels: UPPERCASE Geist Mono. Body: lowercase Hanken.
- Don't bold body text to add emphasis — use the accent, a number, or size instead.
- A yellow `3px` marker-stroke under a section heading is the approved §1.2 deviation for giving headings "definition" without a heavier weight.

---

## 6. OPTICAL CORRECTION — adjust by eye, not by math

The detail that most separates senior from generated work. The renderer is mathematically correct; the eye is not. Correct for the eye.

- **Optical centering:** triangles (play/chevron), and any element with built-in empty space, look off-center when mathematically centered. Nudge toward the visual mass. A "play" triangle sits a hair right of center.
- **Optical alignment over edge alignment:** align to the perceived edge of glyphs/shapes, not the bounding box.
- **Spacing is a scale, then a judgment:** base grid is `4 · 8 · 12 · 16 · 24 · 32`. Screen padding 16–20, card padding 16–18, 24 between sections, 12 between cards. Then nudge by eye where the grid looks wrong (icon next to text usually wants 1–2px less than the grid says).
- **Number alignment:** mono digits are fixed-width by design — right-align stacked numbers so decimals/units line up. Never center a column of numbers you want compared.
- **Border math:** a `3px` border eats into the visible radius. At small sizes bump the radius slightly so the *inner* corner doesn't look square.

---

## 7. MOTION — physical, eased, purposeful

v4 barely specified motion; that's a gap. Motion is where "made by a human" is felt, not just seen.

| moment | duration | easing |
|---|---|---|
| micro (press, toggle, chip) | 120–180ms | ease-out |
| entrance (card, sheet in) | 200–320ms | ease-out / spring |
| exit | 150–220ms | ease-in |
| the reveal count-up | ~800ms | ease-out cubic |

- **Ease-out for entrances, ease-in for exits.** Linear is the tell of no-motion-design. (Existing `Easing.out(Easing.cubic)` in `DailyMacroSummary` is correct — match it.)
- **Spring for anything tactile/playful:** `cubic-bezier(0.34, 1.56, 0.64, 1)` overshoots slightly and reads physical. Use on the press-into-shadow rebound and badge pops, not on long-distance moves.
- **Duration scales with distance/size.** A chip toggling is faster than a full card sliding in. Don't use one duration for everything.
- **Respect reduce-motion.** `AccessibilityInfo.isReduceMotionEnabled` → skip to final state (the reveal already does this).

---

## 8. THE REVEAL (signature moment — unchanged intent, v5 polish)

1. generic "what other apps tell you" number, mono, full opacity (~1s)
2. `alert`-red strike draws across it (220ms, ease-out)
3. it fades to muted
4. **your real number** counts up in huge Geist Mono inside a **yellow brutalist box** carrying `shadowLg` (~800ms)
5. macro boxes + NEAT box stamp in, staggered ~60ms apart (stagger is a v5 add — sequence reads more crafted than simultaneous)
6. success haptic

Reduce-motion: skip to final state.

---

## 9. COPY

- **lowercase** everywhere except UPPERCASE micro-labels.
- **NO em dashes. NO en dashes. Anywhere. Ever.** in UI copy. Use periods, commas, parentheses, or "to" for ranges ("60 to 70%", "1 to 3 years"). Hard rule.
- Specific, never generic. Confident, never preachy. Warm, never soft. No hype, no "crush it", no "journey", no multiple "!".
- Gen-Z Indian English voice: `fr` · `no cap` · `lowkey` · `ngl` · `be fr with yourself` · `drop my plan`.
- Studies live behind a tappable **"why?"** (a yellow block), never as always-on fine print.
