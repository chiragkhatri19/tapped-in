/** @type {import('tailwindcss').Config} */
// STYLING RULE: useColors() hook is the runtime source of truth for themed screens
// (light/dark swap happens at runtime). These Tailwind tokens are an exact mirror of
// constants/colors.ts for static/new components only. Keep the two in sync — never diverge.
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirrors constants/colors.ts light theme (source of truth: brandbook.md)
      // For dynamic theming always use useColors() — these are static-component utilities only.
      colors: {
        // Surfaces
        background: '#F2ECDE',         // bone cream (light theme)
        card: '#FBF7EC',               // warm near-white surface
        foreground: '#111111',         // true black — text + borders
        'card-foreground': '#111111',

        // Primary action
        primary: '#2B3AFF',            // electric cobalt — CTAs / active state
        'primary-foreground': '#FFFFFF',

        // Structure
        muted: '#E7E0CE',              // pressed / disabled fill
        'muted-foreground': '#4A453B', // dark warm taupe (readable, NOT muddy grey)
        border: '#111111',             // black borders — core of the look
        input: '#111111',

        // Semantic
        destructive: '#FF3B2F',        // persimmon red
        'destructive-foreground': '#FFFFFF',
        warning: '#FF3B2F',
        info: '#2B3AFF',

        // VOLT section accents — color-code sections for wayfinding
        highlight: '#E8FF00',          // acid yellow — the pop (reveals, milestones)
        pop: '#E8FF00',
        pink: '#FF3DA5',               // magenta — fat macro / highlights
        teal: '#00C2A8',               // electric teal — science / evidence
        orange: '#FF7A1A',             // safety orange — workout / carbs
        violet: '#7C5CFF',             // electric violet — coach / trainer
        blue: '#2B3AFF',               // cobalt (= primary) explicit section alias

        // Exceptions
        oil: '#FF7A00',                // oil UI only (warmed for brutalist palette)
        tag: '#E8FF00',
        'tag-text': '#111111',
      },

      // Mirrors constants/fonts.ts — Bricolage (display), Hanken (body), Geist Mono (numbers)
      fontFamily: {
        display: ['BricolageGrotesque_700Bold'],
        'display-semi': ['BricolageGrotesque_600SemiBold'],
        'display-med': ['BricolageGrotesque_500Medium'],
        body: ['HankenGrotesk_400Regular'],
        'body-med': ['HankenGrotesk_500Medium'],
        'body-semi': ['HankenGrotesk_600SemiBold'],
        'body-bold': ['HankenGrotesk_700Bold'],
        mono: ['GeistMono_400Regular'],
        'mono-med': ['GeistMono_500Medium'],
        'mono-semi': ['GeistMono_600SemiBold'],
      },

      // Mirrors constants/brutal.ts — shadow tiers + radius scale
      borderRadius: {
        brutal: '10px',    // BRUTAL.radius — buttons, chips, small elements
        card: '14px',      // BRUTAL.radiusLg — card-level surfaces
        chip: '8px',
        pill: '100px',     // BRUTAL.radiusPill — pill/badge shapes
      },

      borderWidth: {
        brutal: '3px',      // BRUTAL.border — standard thick box border
        thin: '2px',        // BRUTAL.borderThin — unselected / secondary
      },
    },
  },
  plugins: [],
};
