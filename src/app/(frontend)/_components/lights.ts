// Lights rising from the forest („Lichter“ of the owner's moon block): soft bokeh orbs with a
// fading trail — the opposite of the sharp stars. Each is born at random along the ridges and
// firs, drifts upward with a gentle sway, pulses softly and fades out, and a new one takes its
// place, so the scene never loops. Drawn on a 2D canvas by the caller's ticker (mountain-scene.tsx).

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
  /** Size of the orb: it is drawn about seven times this across, CSS px. */
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
    rise: 100 + rand() * 180,
    sway: 6 + rand() * 18,
    swaySpeed: 0.3 + rand() * 0.5,
    phase: rand() * Math.PI * 2,
    r: 1.4 + rand() ** 2 * 1.8,
    tint: tintRoll < 0.6 ? 0 : tintRoll < 0.88 ? 1 : 2,
    born: now,
    life: 9 + rand() * 7,
  };
}

/** A light's position and brightness at time t — null once it has faded. It drifts upward and
 * slows as it rises, sways gently, eases in over the first quarter of its life, glows with a slow
 * soft pulse and eases out over the last 40% — nothing sudden. */
export function lightAt(light: Light, t: number) {
  const age = t - light.born;
  if (age < 0 || age > light.life) return null;
  const p = age / light.life;
  const lift = 1 - (1 - p) ** 1.4; // slows as it rises
  const smooth = (x: number) => x * x * (3 - 2 * x);
  const envelope = p < 0.25 ? smooth(p / 0.25) : p > 0.6 ? smooth((1 - p) / 0.4) : 1;
  const pulse = 0.85 + 0.15 * Math.sin(t * 1.3 + light.phase * 2);
  return {
    x: light.x + Math.sin(t * light.swaySpeed + light.phase) * light.sway,
    y: light.y - light.rise * lift,
    alpha: Math.max(0, Math.min(1, envelope * pulse)),
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

  // Soft bokeh orbs, one per tint: a gently lit disc with a feathered rim and no hard core —
  // unlike the stars, which stay sharp points. Rendered once, stamped with drawImage.
  const orbs = LIGHT_TINTS.map((tint) => {
    const orb = document.createElement("canvas");
    orb.width = orb.height = 64;
    const o = orb.getContext("2d");
    if (o) {
      const gradient = o.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, `rgba(${tint}, 0.75)`);
      gradient.addColorStop(0.28, `rgba(${tint}, 0.55)`);
      gradient.addColorStop(0.5, `rgba(${tint}, 0.2)`);
      gradient.addColorStop(1, `rgba(${tint}, 0)`);
      o.fillStyle = gradient;
      o.fillRect(0, 0, 64, 64);
    }
    return orb;
  });

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
      const orb = orbs[light.tint]!;
      const size = light.r * 7 * dpr;
      // A short trail of fading, shrinking orbs where it just was, softening its climb.
      if (!still) {
        for (let k = 3; k >= 1; k--) {
          const past = lightAt(light, t - k * 0.22);
          if (!past) continue;
          const s = size * (1 - k * 0.14);
          ctx.globalAlpha = past.alpha * fade * (0.28 / k);
          ctx.drawImage(orb, past.x * dpr - s / 2, past.y * dpr - s / 2, s, s);
        }
      }
      ctx.globalAlpha = at.alpha * fade;
      ctx.drawImage(orb, at.x * dpr - size / 2, at.y * dpr - size / 2, size, size);
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
