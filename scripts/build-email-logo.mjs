/** Local asset build only; no network, credentials or mail delivery.
 * Reuse the approved wordmark alpha, not newly typeset brand lettering.
 * Run: node scripts/build-email-logo.mjs
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const source = "public/images/email/logo.png";
const output = "public/images/email/logo-lockup-v2.png";
const { data, info } = await sharp(source).resize(360, 184).raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += info.channels) {
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
}
const padded = await sharp(data, { raw: info })
  .extend({ top: 16, bottom: 16, left: 18, right: 18, background: "#151515" })
  .png().toBuffer();
const image = await sharp(padded).flatten({ background: "#151515" }).removeAlpha().png().toBuffer();
await writeFile(output, image);
await writeFile(`${output}.json`, JSON.stringify({
  prompt: "Derived locally from the existing approved Savo wordmark at public/images/email/logo.png. Preserve its lettering and alpha contours; resize to 360x184, recolour to white, pad to 396x216 and flatten onto opaque #151515. No generated brand lettering or external assets. This baked foreground/background pair remains readable when inboxes recolour the surrounding HTML.",
  source,
  sourceSha256: createHash("sha256").update(await readFile(source)).digest("hex"),
  build: "node scripts/build-email-logo.mjs",
  dimensions: [396, 216],
  alpha: false,
}, null, 2) + "\n");
console.log(`Built ${output} (opaque RGB, 396×216) and provenance sidecar.`);
