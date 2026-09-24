// Lights over the forest („Lichter“ of the owner's moon block), kept as small and quiet as the
// block's own fireflies: 3–6px points with a warm white heart and a soft warm glow (the block's
// were blue; warm keeps them apart from the cold stars), drifting only a little, with the block's firefly rhythm — glow up, dim to a third, brighten
// again, go out. What changes: each light is born at a random place with its own path and is
// replaced by a new one, so the scene never loops. Drawn on a 2D canvas by the caller's ticker
// (mountain-scene.tsx).

import { random } from "./starfield";

export type Light = {
  /** Birth point, CSS px. */
  x: number;
  y: number;
  /** Drift at mid-life, px (the block's --fx/--fy); it ends at 1.6× / 1.8× of it. */
  dx: number;
  dy: number;
  /** Diameter, CSS px. */
  size: number;
  tint: number;
  /** A slight meander on top of the drift. */
  phase: number;
  born: number;
  life: number;
};

/** Warm, muted glows — champagne, warm ivory, pale gold — so the lights read as fireflies and never
 * as the cold white-and-ice stars. Kept soft and desaturated: warm light, not orange. */
export const LIGHT_TINTS = ["255, 222, 168", "255, 238, 212", "242, 204, 142"] as const;

/** Heart of every light: a warm white. */
const HEART = "255, 249, 238";

/** One light per this many CSS px of width, 6 to MAX_LIGHTS (the block shows 16). */
export const WIDTH_PER_LIGHT = 150;
export const MAX_LIGHTS = 18;

export const lightCount = (width: number) =>
  Math.max(6, Math.min(MAX_LIGHTS, Math.round(width / WIDTH_PER_LIGHT)));

/** A light born at `now` in the block's band (60–94% down the hero), anywhere across. */
export function createLight(rand: () => number, width: number, height: number, now: number): Light {
  const tintRoll = rand();
  return {
    x: rand() * width,
    y: height * (0.6 + rand() * 0.34),
    dx: (rand() < 0.5 ? -1 : 1) * (15 + rand() * 17),
    dy: -(28 + rand() * 32),
    size: 3 + rand() * 3,
    tint: tintRoll < 0.7 ? 0 : tintRoll < 0.9 ? 1 : 2,
    phase: rand() * Math.PI * 2,
    born: now,
    life: 6 + rand() * 4,
  };
}

// The block's keyframes over a light's life: opacity 0 → 1 (15%) → 0.35 (50%) → 0.95 (85%) → 0,
// scale 0.5 → 1 (50%) → 0.6, position 0 → drift (50%) → 1.6/1.8 × drift. Eased between keys
// (cosine), so velocity is zero at every key and nothing jumps.
type Keys = [number, number][];
const OPACITY: Keys = [
  [0, 0],
  [0.15, 1],
  [0.5, 0.35],
  [0.85, 0.95],
  [1, 0],
];
const SCALE: Keys = [
  [0, 0.5],
  [0.5, 1],
  [1, 0.6],
];
const DRIFT_X: Keys = [
  [0, 0],
  [0.5, 1],
  [1, 1.6],
];
const DRIFT_Y: Keys = [
  [0, 0],
  [0.5, 1],
  [1, 1.8],
];

function keyed(keys: Keys, p: number) {
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i]!;
    const [p0, v0] = keys[i - 1]!;
    if (p <= p1) {
      const k = (p - p0) / (p1 - p0);
      return v0 + (v1 - v0) * (0.5 - 0.5 * Math.cos(k * Math.PI));
    }
  }
  return keys.at(-1)![1];
}

/** A light's position, scale and brightness at time t — null once it has gone out. */
export function lightAt(light: Light, t: number) {
  const age = t - light.born;
  if (age < 0 || age > light.life) return null;
  const p = age / light.life;
  return {
    x: light.x + light.dx * keyed(DRIFT_X, p) + Math.sin(p * Math.PI * 2 + light.phase) * 3,
    y: light.y + light.dy * keyed(DRIFT_Y, p),
    scale: keyed(SCALE, p),
    alpha: keyed(OPACITY, p),
  };
}

/**
 * Binds a canvas: backing store at the device pixel ratio, a population that renews itself,
 * `render(t, fade)`. With `still` (reduced motion), lights stay at their birth point at 0.8, as
 * in the block.
 */
export function bindLights(canvas: HTMLCanvasElement, { still = false } = {}) {
  const ctx = canvas.getContext("2d");
  const rand = random(Date.now() % 100_000);
  let lights: Light[] = [];
  let width = 0;
  let height = 0;
  let last = { t: 0, fade: 0 };

  // The block's shape, one sprite per tint: warm white at the heart, the tint at 45%, clear at 75%,
  // inside a soft glow of the tint (its 8px box-shadow).
  const sprites = LIGHT_TINTS.map((tint) => {
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const c = sprite.getContext("2d");
    if (c) {
      const glow = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      glow.addColorStop(0, `rgba(${tint}, 0.42)`);
      glow.addColorStop(0.45, `rgba(${tint}, 0.14)`);
      glow.addColorStop(1, `rgba(${tint}, 0)`);
      c.fillStyle = glow;
      c.fillRect(0, 0, 64, 64);
      const dot = c.createRadialGradient(32, 32, 0, 32, 32, 10);
      dot.addColorStop(0, `rgba(${HEART}, 1)`);
      dot.addColorStop(0.45, `rgba(${tint}, 1)`);
      dot.addColorStop(0.75, `rgba(${tint}, 0)`);
      c.fillStyle = dot;
      c.fillRect(22, 22, 20, 20);
    }
    return sprite;
  });

  function populate(t: number) {
    // Staggered ages at the start, so the forest is already alive instead of all lights at once.
    lights = Array.from({ length: lightCount(width) }, () => {
      const light = createLight(rand, width, height, t);
      light.born = t - rand() * light.life;
      return light;
    });
  }

  function render(t: number, fade: number) {
    last = { t, fade };
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (fade <= 0 || !width) return;
    const dpr = canvas.width / width;
    lights = lights.map((light) =>
      !still && !lightAt(light, t) ? createLight(rand, width, height, t) : light,
    );
    for (const light of lights) {
      const at = still ? { x: light.x, y: light.y, scale: 1, alpha: 0.8 } : lightAt(light, t);
      if (!at || at.alpha <= 0) continue;
      // The dot spans a third of the sprite; the rest is its glow, about 8px around a 5px light,
      // like the block's box-shadow.
      const size = light.size * at.scale * 3.2 * dpr;
      ctx.globalAlpha = at.alpha * fade;
      ctx.drawImage(sprites[light.tint]!, at.x * dpr - size / 2, at.y * dpr - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    populate(last.t);
    render(last.t, last.fade);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  return { render, destroy: () => observer.disconnect() };
}
