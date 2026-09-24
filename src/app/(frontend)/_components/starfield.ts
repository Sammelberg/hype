// Starfield for the home hero: a 2D canvas, drawn by the caller's ticker (mountain-scene.tsx).
// Each star twinkles on its own rhythm; sizes and brightness follow a restrained night sky —
// mostly faint specks, a few brighter stars with a soft halo, denser high up than near the ridges.

export type Star = {
  x: number;
  y: number;
  /** Radius in CSS px. */
  r: number;
  /** Resting brightness, 0–1. */
  alpha: number;
  /** How far the twinkle dims the star, 0–1 of its brightness. */
  amp: number;
  /** Twinkle speed in radians per second. */
  speed: number;
  phase: number;
  tint: number;
  halo: boolean;
};

/** Starlight, ice blue, pale sapphire — the site palette as RGB channels. */
export const TINTS = ["240, 244, 249", "129, 180, 246", "150, 172, 236"] as const;

/** One star per this many CSS px² of sky, up to MAX_STARS. */
export const AREA_PER_STAR = 9000;
export const MAX_STARS = 320;

// Small seeded PRNG (mulberry32): the same sky for the same size, no flicker between renders.
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createStars(width: number, height: number, seed = 7): Star[] {
  const rand = random(seed);
  const count = Math.min(MAX_STARS, Math.round((width * height) / AREA_PER_STAR));
  const stars = Array.from({ length: count }, (): Star => {
    const halo = rand() < 0.05;
    const tintRoll = rand();
    return {
      x: rand() * width,
      // Biased upward: the sky thins out toward the ridges.
      y: rand() ** 1.6 * height,
      r: halo ? 0.9 + rand() * 0.6 : 0.3 + rand() ** 2 * 0.7,
      alpha: halo ? 0.75 + rand() * 0.25 : 0.2 + rand() * 0.5,
      amp: rand() * 0.6,
      speed: 0.4 + rand() * 1.4,
      phase: rand() * Math.PI * 2,
      tint: tintRoll < 0.7 ? 0 : tintRoll < 0.92 ? 1 : 2,
      halo,
    };
  });
  // Grouped by tint, so a frame changes fillStyle three times instead of per star.
  return stars.sort((a, b) => a.tint - b.tint);
}

/** Brightness of a star at time t (seconds); `still` for reduced motion. */
export function starAlpha(star: Star, t: number, still = false) {
  if (still) return star.alpha;
  return star.alpha * (1 - star.amp * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase)));
}

/**
 * Binds a canvas: keeps its backing store at the device pixel ratio, regenerates the sky on
 * resize and exposes `render(t, fade)`. The caller decides when to render.
 */
export function bindStarfield(canvas: HTMLCanvasElement, { still = false } = {}) {
  const ctx = canvas.getContext("2d");
  let stars: Star[] = [];
  let last = { t: 0, fade: 0 };

  // Soft halo, rendered once and stamped with drawImage.
  const halo = document.createElement("canvas");
  halo.width = halo.height = 32;
  const h = halo.getContext("2d");
  if (h) {
    const g = h.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(180, 208, 250, 0.5)");
    g.addColorStop(1, "rgba(180, 208, 250, 0)");
    h.fillStyle = g;
    h.fillRect(0, 0, 32, 32);
  }

  function render(t: number, fade: number) {
    last = { t, fade };
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    if (fade <= 0) return;
    const dpr = width / (canvas.clientWidth || 1);
    let tint = -1;
    for (const star of stars) {
      const a = starAlpha(star, t, still) * fade;
      if (star.halo) {
        ctx.globalAlpha = a * 0.6;
        const size = star.r * 12 * dpr;
        ctx.drawImage(halo, star.x * dpr - size / 2, star.y * dpr - size / 2, size, size);
      }
      if (star.tint !== tint) {
        tint = star.tint;
        ctx.fillStyle = `rgb(${TINTS[tint]})`;
      }
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(star.x * dpr, star.y * dpr, star.r * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    stars = createStars(width, height);
    render(last.t, last.fade);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  return { render, destroy: () => observer.disconnect() };
}
