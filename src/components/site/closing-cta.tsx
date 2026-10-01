import type { CSSProperties } from "react";

import { getSiteSettings } from "@/data/queries";
import { random } from "@/lib/curves";
import { HORIZON_H, HORIZON_W, horizon } from "@/lib/horizon";

import styles from "./closing-cta.module.css";
import { FIR_DESIGNS } from "./fir-shapes";
import { InView } from "./in-view";
import { StarCta } from "./star-cta";
import { LitWords } from "./words";

const FIR = FIR_DESIGNS.schlank;
const [, , FIR_W, FIR_H] = FIR.viewBox.split(" ").map(Number) as [number, number, number, number];

const LAND = horizon("anfrage");

// A few of the hero's forest lights over the land, drifting up and fading: warm gold, never orange.
const LIGHTS = (() => {
  const rnd = random(1803);
  return Array.from({ length: 9 }, () => ({
    x: Math.round(8 + rnd() * 84),
    size: Math.round(3 + rnd() * 3),
    delay: Math.round(rnd() * 90) / 10,
    duration: Math.round(70 + rnd() * 50) / 10,
  }));
})();

// The invitation that ends the home page and the content pages: one sentence, one action. Its
// words light up as it is read; underneath, the land comes back — one ice ridge drawn as it comes
// into view, the copper arc on its crest, a few firs and the forest lights rising — and the footer
// stands on it. Its text is edited under /admin → Website → Abschluss „Anfrage“.
export async function ClosingCta() {
  const { cta } = await getSiteSettings();
  if (!cta?.title) return null;

  return (
    <InView className="border-t">
      <section aria-labelledby="anfrage-titel" className={styles.cta} data-cms-zone="anfrage">
        <div className="page-container pt-24 sm:pt-36 3xl:pt-44">
          <h2
            id="anfrage-titel"
            className="max-w-5xl text-[clamp(2.5rem,1.3rem+4.6vw,6rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance 3xl:max-w-6xl"
          >
            <LitWords text={cta.title} />
          </h2>
          <div className="mt-10 flex flex-col items-start gap-8 sm:mt-14 lg:flex-row lg:items-end lg:justify-between">
            {cta.text ? (
              <p className="max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl 3xl:text-2xl">
                {cta.text}
              </p>
            ) : null}
            {cta.label ? <StarCta label={cta.label} /> : null}
          </div>
        </div>
        <div aria-hidden="true" className={styles.land}>
          {LIGHTS.map((light) => (
            <span
              key={`${light.x}-${light.delay}`}
              className={`${styles.light} loop`}
              style={
                {
                  left: `${light.x}%`,
                  "--size": `${light.size}px`,
                  "--delay": `${light.delay}s`,
                  "--duration": `${light.duration}s`,
                } as CSSProperties
              }
            />
          ))}
          <svg viewBox={`0 0 ${HORIZON_W} ${HORIZON_H}`} preserveAspectRatio="xMidYMax slice">
            <symbol id="anfrage-tanne" viewBox={FIR.viewBox}>
              <path fill="currentColor" d={FIR.d} />
            </symbol>
            <path className={styles.ground} d={LAND.ground} />
            {LAND.firs.map((fir) => {
              const w = (fir.h * FIR_W) / FIR_H;
              return (
                <use
                  key={fir.x}
                  href="#anfrage-tanne"
                  className={styles.fir}
                  x={fir.x - w / 2}
                  y={fir.y - fir.h}
                  width={w}
                  height={fir.h}
                />
              );
            })}
            <path className={`${styles.ridge} sd-stroke`} d={LAND.ridge} pathLength={1} />
            <path className={`${styles.arc} sd-stroke`} d={LAND.arc} pathLength={1} />
          </svg>
        </div>
      </section>
    </InView>
  );
}
