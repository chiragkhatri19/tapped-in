// Brand palette — tappd in v4  ·  "VOLT"  ·  neo-brutalism
// Source of truth: brandbook.md
// Black + bone cream + electric cobalt (hero) + acid yellow (the pop).
// High contrast, no muted mud, no gradients. Borders are black and mean it.
// NOTE: `border` is intentionally === `foreground` so hard shadows read on both themes.

const colors = {
  light: {
    // Surfaces
    background: '#F2ECDE',      // bone cream
    foreground: '#111111',      // true black (text, borders, shadows)
    card: '#FBF7EC',            // warm near-white surface
    cardForeground: '#111111',

    // Structure
    primary: '#2B3AFF',         // electric cobalt — CTAs / active state
    primaryForeground: '#FFFFFF',
    secondary: '#FBF7EC',
    secondaryForeground: '#111111',
    muted: '#E7E0CE',           // pressed / disabled fill
    mutedForeground: '#4A453B', // dark warm taupe (readable, NOT muddy grey)
    border: '#111111',          // black borders (core of the look)
    input: '#111111',
    surface: '#F2ECDE',
    tag: '#E8FF00',
    tagText: '#111111',

    // Accents
    highlight: '#E8FF00',       // acid yellow — the pop (reveal, milestones). text on it = black
    pistachio: '#E8FF00',       // alias → yellow (reveal underline)
    persimmon: '#FF3B2F',       // alert red — strikethrough / warnings
    mustard: '#E8FF00',         // "why?" chip = yellow block
    iris: '#2B3AFF',            // alias → cobalt

    // App section accents (VOLT family — color-code sections for wayfinding)
    pop: '#E8FF00',             // acid yellow
    pink: '#FF3DA5',            // magenta — fat macro / highlights
    teal: '#00C2A8',            // electric teal — science / evidence
    orange: '#FF7A1A',          // safety orange — workout / carbs
    violet: '#7C5CFF',          // electric violet — coach / trainer
    blue: '#2B3AFF',            // cobalt (= primary) for explicit section use

    // Semantic / legacy compat
    destructive: '#FF3B2F',
    destructiveForeground: '#FFFFFF',
    accent: '#E8FF00',
    accentForeground: '#111111',
    warning: '#FF3B2F',
    info: '#2B3AFF',
    oil: '#FF7A00',             // hardcoded exception — oil UI only (warmed for brutalist palette)
    text: '#111111',
    tint: '#2B3AFF',
  },
  dark: {
    // Surfaces (deep navy blue-black — shadows read dramatically on navy; cream borders pop)
    background: '#0D0F1C',      // deep navy black
    foreground: '#F2ECDE',      // bone cream (mirrors light background — intentional inversion)
    card: '#131626',            // dark navy card surface
    cardForeground: '#F2ECDE',

    // Structure
    primary: '#3B4AFF',         // cobalt, lifted for dark
    primaryForeground: '#FFFFFF',
    secondary: '#131626',
    secondaryForeground: '#F2ECDE',
    muted: '#1A1D2E',           // navy pressed / disabled / track fill
    mutedForeground: '#9BA3C0', // cool blue-tinted readable muted
    border: '#F2ECDE',          // cream borders on navy — maximum contrast
    input: '#F2ECDE',
    surface: '#0D0F1C',
    tag: '#E8FF00',
    tagText: '#111111',

    // Accents
    highlight: '#E8FF00',
    pistachio: '#E8FF00',
    persimmon: '#FF5247',
    mustard: '#E8FF00',
    iris: '#3B4AFF',

    // App section accents (warm dark reads them slightly bolder — keep saturation)
    pop: '#E8FF00',
    pink: '#FF4FAF',
    teal: '#00CCAF',
    orange: '#FF7A1A',
    violet: '#8A6BFF',
    blue: '#3B4AFF',

    // Semantic / legacy compat
    destructive: '#FF5247',
    destructiveForeground: '#FFFFFF',
    accent: '#E8FF00',
    accentForeground: '#111111',
    warning: '#FF5247',
    info: '#3B4AFF',
    oil: '#FF7A1A',
    text: '#F2ECDE',
    tint: '#3B4AFF',
  },
  radius: 10,
};

export default colors;

/**
 * Append a 2-digit hex alpha to a 6-digit hex color string.
 * withAlpha('#FF7A1A', 0.08) → '#FF7A1A14'
 * alpha: 0–1 float
 */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return hex + a.toString(16).padStart(2, '0');
}
