<!-- Decoration only: a sun rising behind a sprout, drawn straight onto the page's background (no frame, no fill of
     its own) in the theme's tints, so it follows the configurator's colours. Hidden from screen readers. -->
<svg class="illustration" viewBox="0 0 220 180" aria-hidden="true" focusable="false">
  <circle class="halo-outer" cx="130" cy="112" r="78" />
  <circle class="halo" cx="130" cy="112" r="56" />
  <circle class="sun" cx="130" cy="112" r="36" />
  <circle class="core" cx="130" cy="112" r="22" />
  <g class="rays">
    <path d="M130 46 V32" />
    <path d="M84 64 L75 55" />
    <path d="M176 64 L185 55" />
    <path d="M66 106 H52" />
    <path d="M194 106 H208" />
  </g>

  <path class="ground" d="M24 160 C 64 150, 120 150, 196 162" />
  <path class="ground faint" d="M60 172 C 100 166, 150 166, 210 174" />

  <path class="stem" d="M96 158 C 96 140, 94 126, 99 106" />
  <path class="leaf" d="M99 114 C 108 100, 126 98, 136 104 C 126 118, 110 122, 99 114 Z" />
  <path class="vein" d="M101 113 C 112 108, 122 106, 131 105" />
  <path class="leaf" d="M96 130 C 88 118, 72 114, 62 119 C 70 132, 86 136, 96 130 Z" />
  <path class="vein" d="M94 129 C 84 124, 76 121, 67 120" />
</svg>

<style>
  .illustration {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  /* The sun in the primary itself: decoration, so the
     colour as chosen, not its 3:1 shade. Each ring an opaque tint of it, never the colour made see-through: over the
     page's cool tint a transparent warm colour turns grey-brown. Tinted from the card's own
     colour, not near-white: whiter than the card, the rings glared. Brighter toward the middle. */
  .halo-outer {
    fill: color-mix(in srgb, var(--accent) 8%, var(--card-bg));
  }

  .halo {
    fill: color-mix(in srgb, var(--accent) 16%, var(--card-bg));
  }

  .sun {
    fill: color-mix(in srgb, var(--accent) 28%, var(--card-bg));
  }

  .core {
    fill: color-mix(in srgb, var(--accent) 4%, var(--card-bg));
  }

  .rays path,
  .ground {
    fill: none;
    stroke-linecap: round;
  }

  /* A line, so the primary's 3:1 shade: the primary itself is a fill only (a light one vanishes as a line) */
  .rays path {
    stroke: var(--accent-ui);
    stroke-width: 1.5;
    stroke-opacity: 0.6;
  }

  .ground {
    stroke: var(--accent-ui);
    stroke-width: 1.5;
    stroke-opacity: 0.35;
  }

  .ground.faint {
    stroke-opacity: 0.18;
  }

  .stem,
  .vein {
    fill: none;
    stroke: var(--accent-ui);
    stroke-linecap: round;
    stroke-opacity: 0.75;
  }

  .stem {
    stroke-width: 2;
  }

  .vein {
    stroke-width: 1;
    stroke-opacity: 0.45;
  }

  .leaf {
    fill: var(--accent-bg-subtle);
    fill-opacity: 0.7;
    stroke: var(--accent-ui);
    stroke-opacity: 0.75;
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
</style>
