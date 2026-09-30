// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, describe, expect, it, vi } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "media-test-"));
vi.mock("./paths", () => ({ MEDIA_DIR: dir }));

const { storeUpload, UploadError } = await import("./store");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const file = (bytes: Buffer | string, name: string) =>
  new File([typeof bytes === "string" ? bytes : new Uint8Array(bytes)], name);

// A photo as a phone writes it: camera, owner and the place it was taken.
const photoWithGps = () =>
  sharp({ create: { width: 1200, height: 800, channels: 3, background: "#3a5a8c" } })
    .withExif({
      IFD0: { Make: "Probecam", Artist: "Erika Mustermann" },
      IFD3: {
        GPSLatitudeRef: "N",
        GPSLatitude: "47/1 59/1 0/1",
        GPSLongitudeRef: "E",
        GPSLongitude: "7/1 51/1 0/1",
      },
    })
    .jpeg()
    .toBuffer();

describe("storeUpload", () => {
  it("refuses SVG, even without a script tag", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.cookie)"><rect width="10" height="10"/></svg>`;
    await expect(storeUpload(file(svg.padEnd(64, " "), "logo.svg"))).rejects.toBeInstanceOf(
      UploadError,
    );
  });

  it("strips camera data and location from the original", async () => {
    const bytes = await photoWithGps();
    expect((await sharp(bytes).metadata()).exif).toBeDefined();

    const stored = await storeUpload(file(bytes, "baustelle.jpg"));
    const original = readFileSync(path.join(dir, stored.filename));
    const meta = await sharp(original).metadata();
    expect(meta.exif).toBeUndefined();
    expect(original.includes(Buffer.from("Erika"))).toBe(false);
    expect(meta.format).toBe("jpeg");
    expect(stored.width).toBe(1200);
  });

  it("strips them from the variants too", async () => {
    const stored = await storeUpload(file(await photoWithGps(), "halle.jpg"));
    for (const size of Object.values(stored.sizes)) {
      const meta = await sharp(readFileSync(path.join(dir, size!.filename))).metadata();
      expect(meta.exif).toBeUndefined();
    }
  });
});

describe("storeUpload, a portrait photo stored sideways", () => {
  it("stands it upright and measures it upright", async () => {
    const sideways = await sharp({
      create: { width: 900, height: 600, channels: 3, background: "#222" },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const stored = await storeUpload(file(sideways, "hochkant.jpg"));
    expect([stored.width, stored.height]).toEqual([600, 900]);
    const meta = await sharp(readFileSync(path.join(dir, stored.filename))).metadata();
    expect([meta.width, meta.height, meta.orientation]).toEqual([600, 900, undefined]);
  });
});
