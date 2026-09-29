// The hero call to action's pole star („twinkle“, the owner's pick from the concept sheet): on
// hover or keyboard focus a star rises under the label and twinkles as if seen through air — its
// colour drifts ice → white → copper gold, its rays flicker, a double halo rings it. One critically
// damped spring drives everything, so it grows, shrinks and reverses mid-way without a stop.

type RGB = readonly [number, number, number];

const ICE: RGB = [147, 191, 240]; // primary-soft
const WHITE: RGB = [255, 255, 255];
const COPPER: RGB = [214, 138, 77]; // the ridge's highlight arc, #d68a4d
const COLOUR_CYCLE: readonly RGB[] = [ICE, WHITE, COPPER, ICE];
/** One full ice → white → copper → ice turn, in seconds. */
export const COLOUR_PERIOD = 10 / 3;

export type Spring = { p: number; v: number };

/** Natural frequency: settles in about half a second and, critically damped, never overshoots. */
const OMEGA = 9;

/** Longest stretch one frame may advance: a tab returning from the background resumes, not leaps. */
const MAX_FRAME = 0.25;

/**
 * Advances the spring toward `target` (0 or 1) by the real time dt, in substeps of at most 1/120s,
 * so a slow machine drawing few frames still keeps real time instead of running slow.
 */
export function stepSpring({ p, v }: Spring, target: number, dt: number): Spring {
  let left = Math.min(Math.max(dt, 0), MAX_FRAME);
  while (left > 0) {
    const h = Math.min(left, 1 / 120);
    v += (OMEGA * OMEGA * (target - p) - 2 * OMEGA * v) * h;
    p += v * h;
    left -= h;
  }
  return { p, v };
}

/** Gone: the star has shrunk away and the loop may stop. */
export const isAtRest = ({ p, v }: Spring, target: number) =>
  target === 0 && Math.abs(p) < 0.001 && Math.abs(v) < 0.01;

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const mix = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

/** The star's colour at time t, eased between the stops of the cycle. */
export function starColour(t: number): RGB {
  const phase = (((t / COLOUR_PERIOD) % 1) + 1) % 1;
  const segment = phase * (COLOUR_CYCLE.length - 1);
  const i = Math.floor(segment);
  return mix(COLOUR_CYCLE[i]!, COLOUR_CYCLE[i + 1]!, smooth(segment - i));
}

/** Scintillation: three detuned sines, so the flicker never repeats visibly; 0.86…1.14. */
export function flicker(t: number) {
  const n = Math.sin(t * 3.1) + 0.6 * Math.sin(t * 4.7 + 1.3) + 0.3 * Math.sin(t * 7.3 + 2.1);
  return 1 + (0.14 * n) / 1.9;
}

const TAU = Math.PI * 2;
const rgba = (c: RGB, a: number) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a))})`;

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: RGB, a: number) {
  if (r <= 0.1 || a <= 0.001) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a));
  g.addColorStop(0.35, rgba(c, a * 0.45));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// A tapered ray: bright at the root, fading to nothing at the tip.
function ray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  c: RGB,
  a: number,
) {
  if (length <= 0.5 || a <= 0.001) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, 0, length, 0);
  g.addColorStop(0, rgba(c, a));
  g.addColorStop(0.4, rgba(c, a * 0.5));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -width);
  ctx.lineTo(length, 0);
  ctx.lineTo(0, width);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * One frame, in CSS pixels around the star's centre. `p` is the spring (0 gone, 1 full), `s` the
 * scale of the label (1 at 30px type), `span` the label's width, which the long rays follow.
 */
function drawPolarStar(
  ctx: CanvasRenderingContext2D,
  { x, y, p, t, s, span }: { x: number; y: number; p: number; t: number; s: number; span: number },
) {
  if (p <= 0.0005) return;
  const colour = starColour(t);
  const f = flicker(t);
  const r = p * s;

  glow(ctx, x, y, 36 * r, colour, 0.16 * p);
  glow(ctx, x, y, 15 * r * f, colour, 0.55 * p);

  // Double halo, flattened like the band it sits in: ice inside, copper just outside.
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = rgba(ICE, 0.18 * p);
  ctx.beginPath();
  ctx.ellipse(x, y, 21 * r, 21 * r * 0.45, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = rgba(COPPER, 0.13 * p);
  ctx.beginPath();
  ctx.ellipse(x, y, 23 * r, 23 * r * 0.45, 0, 0, TAU);
  ctx.stroke();

  // Long horizontal rays along the label, short vertical ones, faint diagonals.
  [0, Math.PI].forEach((a, k) =>
    ray(
      ctx,
      x,
      y,
      a,
      span * 0.3 * p * (1 + 0.12 * Math.sin(t * 5 + k * 2)),
      1.2 * s,
      colour,
      0.85 * p,
    ),
  );
  [-Math.PI / 2, Math.PI / 2].forEach((a, k) =>
    ray(ctx, x, y, a, 12 * r * (1 + 0.15 * Math.sin(t * 6 + k)), 1 * s, colour, 0.8 * p),
  );
  for (let k = 0; k < 4; k++)
    ray(ctx, x, y, Math.PI / 4 + (k * Math.PI) / 2, 8 * r * f, 0.6 * s, WHITE, 0.5 * p);

  glow(ctx, x, y, 5 * r * f, WHITE, p);
  ctx.fillStyle = rgba(WHITE, p);
  ctx.beginPath();
  ctx.arc(x, y, 1.7 * r * f, 0, TAU);
  ctx.fill();
}

/** How far the canvas reaches past the link on each side, so glow and rays are never cut off. */
const BLEED = { x: 90, top: 30, bottom: 40 } as const;

/**
 * Binds the star to a canvas inside `host` (the link): sizes the backing store at the device pixel
 * ratio, runs a frame loop only while the star is showing or on its way, and mirrors the spring
 * into `--p` on the host for the arrow. With `still` (reduced motion) the star appears at once and
 * does not twinkle.
 */
export function bindPolarStar(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  { still = false } = {},
) {
  const ctx = canvas.getContext("2d");
  let spring: Spring = { p: 0, v: 0 };
  let target = 0;
  let t = 0;
  let last = 0;
  let frame = 0;
  let width = 0;
  let height = 0;
  let scale = 1;
  let dpr = 1;

  function render() {
    host.style.setProperty("--p", spring.p.toFixed(3));
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.globalCompositeOperation = "lighter";
    drawPolarStar(ctx, {
      x: BLEED.x + width / 2,
      y: BLEED.top + height - 15 * scale,
      p: Math.max(0, spring.p),
      t,
      s: scale,
      span: width,
    });
    ctx.globalCompositeOperation = "source-over";
  }

  function tick(now: number) {
    const dt = (now - last) / 1000;
    last = now;
    spring = stepSpring(spring, target, dt);
    t += Math.min(dt, MAX_FRAME);
    if (isAtRest(spring, target)) {
      spring = { p: 0, v: 0 };
      frame = 0;
      render();
      return;
    }
    render();
    frame = requestAnimationFrame(tick);
  }

  function set(on: boolean) {
    target = on ? 1 : 0;
    if (still) {
      spring = { p: target, v: 0 };
      render();
      return;
    }
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = host.offsetWidth;
    height = host.offsetHeight;
    scale = parseFloat(getComputedStyle(host).fontSize) / 30 || 1;
    const w = width + BLEED.x * 2;
    const h = height + BLEED.top + BLEED.bottom;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    render();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  return {
    set,
    destroy() {
      observer.disconnect();
      cancelAnimationFrame(frame);
    },
  };
}
