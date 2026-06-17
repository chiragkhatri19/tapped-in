// Neo-brutalist structural tokens — tappd in v4
// Thick black borders + hard offset shadows + rounded corners with depth hierarchy.

export const BRUTAL = {
  border: 3,        // border width on every box/button/input
  borderThin: 2,    // unselected / secondary borders (chips, tiles)
  shadowLg: 8,      // hero/primary cards — maximum depth (e.g. DailyMacroSummary)
  shadow: 5,        // standard secondary cards
  shadowSm: 3,      // chips, small interactive elements
  radius: 10,       // buttons, chips, small elements
  radiusLg: 14,     // card-level surfaces (BrutalBox default)
  radiusPill: 100,  // pill/badge shapes
} as const;
