// Lights rising from the forest („Lichter“ of the owner's moon block): soft glowing motes born
// at random along the ridges and firs, drifting upward with a gentle sway, flickering and fading
// out — each one new, so the scene never loops. Drawn on a 2D canvas by the caller's ticker
// (mountain-scene.tsx).

import { random } from "./starfield";

export type Light = {
  /** Birth point, CSS px. */
  x: number;
  y: number;
  /** Upward travel over its life, px. */
  rise: number;
  /** Sideways sway amplitude (px) and frequency (radians per second). */
  sway: number;
  swaySpeed: number;
  phase: number;
  /** Radius of the bright core, CSS px. */
  r: number;
  tint: number;
  born: number;
  life: number;
};

/** Ice blue, starlight, sapphire — the site palette as RGB channels. */
export const LIGHT_TINTS = ["129, 180, 246", "240, 244, 249", "96, 140, 240"] as const;

/** One light per this many CSS px of width, up to MAX_LIGHTS. */
export const WIDTH_PER_LIGHT = 70;
export const MAX_LIGHTS = 40;

export const lightCount = (width: number) =>
  Math.max(6, Math.min(MAX_LIGHTS, Math.round(width / WIDTH_PER_LIGHT)));

/** A light born at `now` in the forest band (the lower 35–5% of the hero), anywhere across. */
export function createLight(rand: () => number, width: number, height: number, now: number): Light {
  const tintRoll = rand();
  return {
    x: rand() * width,
    y: height * (0.65 + rand() * 0.3),
    rise: 120 + rand() * 220,
    sway: 8 + rand() * 24,
    swaySpeed: 0.6 + rand() * 1.2,
    phase: rand() * Math.PI * 2,
    r: 1 + rand() ** 2 * 1.6,
    tint: tintRoll < 0.6 ? 0 : tintRoll < 0.88 ? 1 : 2,
    born: now,
    life: 5 + rand() * 6,
  };
}

/** A light's position and brightness at time t — null once it has faded. It eases upward, sways,
 * fades in over the first 15% of its life, flickers softly and fades out over the last 35%. */
export function lightAt(light: Light, t: number) {
  const age = t - light.born;
  if (age < 0 || age > light.life) return null;
  const p = age / light.life;
  const lift = 1 - (1 - p) ** 1.6; // quick start, slowing as it rises
  const envelope = p < 0.15 ? p / 0.15 : p > 0.65 ? (1 - p) / 0.35 : 1;
  const flicker = 0.8 + 0.2 * Math.sin(t * 3.1 + light.phase * 2);
  return {
    x: light.x + Math.sin(t * light.swaySpeed + light.phase) * light.sway,
    y: light.y - light.rise * lift,
    alpha: Math.max(0, Math.min(1, envelope * flicker)),
  };
}

/**
 * Binds a canvas: backing store at the device pixel ratio, a population that renews itself,
 * `render(t, fade)`. With `still`, lights are drawn once where they were born.
 */
export function bindLights(canvas: HTMLCanvasElement, { still = false } = {}) {
  const ctx = canvas.getContext("2d");
  const rand = random(Date.now() % 100_000);
  let lights: Light[] = [];
  let width = 0;
  let height = 0;
  let last = { t: 0, fade: 0 };

  const glow = document.createElement("canvas");
  glow.width = glow.height = 48;
  const g = glow.getContext("2d");
  if (g) {
    const gradient = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gradient.addColorStop(0, "rgba(160, 196, 250, 0.55)");
    gradient.addColorStop(0.35, "rgba(110, 155, 245, 0.22)");
    gradient.addColorStop(1, "rgba(110, 155, 245, 0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 48, 48);
  }

  function populate(t: number) {
    // Staggered ages at the start, so the forest is already alive instead of all lights rising at once.
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
      const at = still
        ? { x: light.x, y: light.y - light.rise * 0.4, alpha: 0.8 }
        : lightAt(light, t);
      if (!at || at.alpha <= 0) continue;
      const a = at.alpha * fade;
      const halo = light.r * 9 * dpr;
      ctx.globalAlpha = a;
      ctx.drawImage(glow, at.x * dpr - halo / 2, at.y * dpr - halo / 2, halo, halo);
      ctx.fillStyle = `rgba(${LIGHT_TINTS[light.tint]}, ${a})`;
      ctx.beginPath();
      ctx.arc(at.x * dpr, at.y * dpr, light.r * dpr, 0, Math.PI * 2);
      ctx.fill();
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
