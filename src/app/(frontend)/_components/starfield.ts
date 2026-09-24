// Starfall for the home hero: a 2D canvas, drawn by the caller's ticker (mountain-scene.tsx).
// A quiet field of twinkling stars — mostly faint specks, a few with a soft halo, denser high up —
// and over it a random starfall: every shooting star picks its own place, direction, angle,
// speed, tail and brightness, in an uneven rhythm of bursts and lulls.

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
export function random(seed: number) {
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

export type Meteor = {
  /** Start of the streak, CSS px. */
  x: number;
  y: number;
  /** Unit direction of travel. */
  dx: number;
  dy: number;
  /** px per second. */
  speed: number;
  /** Full tail length, px. */
  length: number;
  /** Stroke width, CSS px. */
  width: number;
  /** Peak brightness, 0–1. */
  alpha: number;
  /** Colour of the tail (index into TINTS); the head is always starlight. */
  tint: number;
  /** Birth time and lifetime, seconds. */
  born: number;
  life: number;
  bright: boolean;
};

/** At most this many shooting stars at once. */
export const MAX_METEORS = 4;

/** Seconds until the next shooting star: usually a pause of about a second, sometimes a quick
 * burst, sometimes a lull — the uneven rhythm of a real shower. */
export function nextGap(rand: () => number) {
  const roll = rand();
  if (roll < 0.2) return 0.08 + rand() * 0.25; // burst
  if (roll < 0.85) return 0.5 + rand() * 1.1;
  return 1.8 + rand() * 1.7; // lull
}

/** A shooting star born at `now`, all of it random: anywhere in the upper sky, falling left or
 * right at any angle from shallow to steep (15–65° below the horizon), with its own speed, tail,
 * width, brightness and tint — from faint specks to the occasional bright fireball. */
export function createMeteor(
  rand: () => number,
  width: number,
  height: number,
  now: number,
): Meteor {
  const below = ((15 + rand() * 50) * Math.PI) / 180;
  const direction = rand() < 0.5 ? -1 : 1;
  const size = rand(); // 0 faint … 1 fireball
  const bright = size > 0.82;
  const faint = size < 0.3;
  const tintRoll = rand();
  return {
    x: rand() * width,
    y: rand() * height * 0.45,
    dx: direction * Math.cos(below),
    dy: Math.sin(below),
    speed: 450 + rand() * 800,
    length: bright ? 260 + rand() * 180 : faint ? 50 + rand() * 70 : 120 + rand() * 180,
    width: bright ? 2 + rand() * 0.6 : faint ? 0.8 + rand() * 0.3 : 1.2 + rand() * 0.6,
    alpha: bright ? 1 : faint ? 0.35 + rand() * 0.25 : 0.6 + rand() * 0.35,
    tint: tintRoll < 0.55 ? 1 : tintRoll < 0.85 ? 0 : 2,
    born: now,
    life: faint ? 0.35 + rand() * 0.35 : 0.55 + rand() * 0.7,
    bright,
  };
}

/** Where a meteor is at time t: its head, tail end and brightness — or null once it has burnt
 * out. The tail grows in, the whole streak fades in fast and out slowly. */
export function meteorAt(m: Meteor, t: number) {
  const age = t - m.born;
  if (age < 0 || age > m.life) return null;
  const p = age / m.life;
  const head = { x: m.x + m.dx * m.speed * age, y: m.y + m.dy * m.speed * age };
  const tail = Math.min(1, p / 0.3) * m.length;
  const alpha = p < 0.15 ? p / 0.15 : Math.cos(((p - 0.15) / 0.85) * (Math.PI / 2));
  return {
    x: head.x,
    y: head.y,
    tailX: head.x - m.dx * tail,
    tailY: head.y - m.dy * tail,
    alpha: Math.max(0, Math.min(1, alpha)),
  };
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
  let meteors: Meteor[] = [];
  let nextMeteor = -1;
  const rand = random(Date.now() % 100_000);
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
    if (!still) drawMeteors(t, fade, dpr);
    ctx.globalAlpha = 1;
  }

  function drawMeteors(t: number, fade: number, dpr: number) {
    if (!ctx) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (nextMeteor < 0 || t - nextMeteor > 8) nextMeteor = t + nextGap(rand); // start or resume
    if (t >= nextMeteor) {
      if (meteors.length < MAX_METEORS) meteors.push(createMeteor(rand, width, height, t));
      nextMeteor = t + nextGap(rand);
    }
    meteors = meteors.filter((m) => {
      const at = meteorAt(m, t);
      if (!at) return false;
      const a = at.alpha * m.alpha * fade;
      const gradient = ctx.createLinearGradient(
        at.x * dpr,
        at.y * dpr,
        at.tailX * dpr,
        at.tailY * dpr,
      );
      gradient.addColorStop(0, `rgba(${TINTS[0]}, ${a})`);
      gradient.addColorStop(0.2, `rgba(${TINTS[m.tint]}, ${a * 0.7})`);
      gradient.addColorStop(1, `rgba(${TINTS[m.tint]}, 0)`);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = m.width * dpr;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(at.x * dpr, at.y * dpr);
      ctx.lineTo(at.tailX * dpr, at.tailY * dpr);
      ctx.stroke();
      // Glowing head; brighter meteors carry a larger one.
      const size = m.width * (m.bright ? 10 : 7) * dpr;
      ctx.globalAlpha = a;
      ctx.drawImage(halo, at.x * dpr - size / 2, at.y * dpr - size / 2, size, size);
      return true;
    });
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
