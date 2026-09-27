// Refresh one bundled firmware preset from a freshly built merged image.
//
//   node desktop/update-firmware.mjs claude-control-demo path/to/merged-binary.bin
//
// Copies the image to public/assets/firmware/<id>.bin and updates everything that pins it:
// the catalog (bytes + sha256), the sidebar size label in index.html, and the expected
// hash in test/presets.test.mjs. The preset itself must already exist in all three.
import { createHash } from "node:crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MAX_FIRMWARE_BYTES } from "../public/firmware.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [id, source] = process.argv.slice(2);
if (!id || !source) {
  console.error("usage: node desktop/update-firmware.mjs <preset-id> <merged-binary.bin>");
  process.exit(2);
}

const image = await readFile(source);
if (image.byteLength === 0 || image.byteLength > MAX_FIRMWARE_BYTES) {
  throw new Error(`image size ${image.byteLength} is outside 1..${MAX_FIRMWARE_BYTES}`);
}
const sha256 = createHash("sha256").update(image).digest("hex");
const file = `/assets/firmware/${id}.bin`;
const sizeLabel = `${(image.byteLength / 1024 / 1024).toFixed(2)} MB`;

// change() returns the new text and throws when what it has to update is missing;
// an unchanged result (same size / same hash as before) is fine.
async function edit(relative, change) {
  const filename = path.join(root, relative);
  const before = await readFile(filename, "utf8");
  const after = change(before);
  if (after !== before) await writeFile(filename, after);
}

await copyFile(source, path.join(root, "public", file.slice(1)));

await edit("public/assets/firmware/catalog.json", (text) => {
  const catalog = JSON.parse(text);
  const entry = catalog.firmwares.find((firmware) => firmware.id === id);
  if (!entry) throw new Error(`catalog.json has no preset ${id}`);
  Object.assign(entry, { file, bytes: image.byteLength, sha256 });
  return `${JSON.stringify(catalog, null, 2)}\n`;
});

// The <small> label under the preset ends with the image size ("… · 1.51 MB").
const SIZE = /[\d.]+ MB$/;
await edit("public/index.html", (text) => {
  const start = text.indexOf(`data-firmware-id="${id}"`);
  if (start < 0) throw new Error(`index.html has no preset ${id}`);
  const smallStart = text.indexOf("<small>", start);
  const smallEnd = text.indexOf("</small>", smallStart);
  const label = text.slice(smallStart, smallEnd);
  if (!SIZE.test(label)) throw new Error(`index.html: the ${id} label has no size`);
  return text.slice(0, smallStart) + label.replace(SIZE, sizeLabel) + text.slice(smallEnd);
});

await edit("test/presets.test.mjs", (text) => {
  const escaped = file.replaceAll(".", "\\.");
  const pinned = new RegExp(`("${escaped}",\\s*\\n\\s*")[0-9a-f]*(")`);
  if (!pinned.test(text)) throw new Error(`presets.test.mjs pins no hash for ${file}`);
  return text.replace(pinned, `$1${sha256}$2`);
});

console.log(`${id}: ${image.byteLength} bytes, sha256 ${sha256.slice(0, 16)}…, label ${sizeLabel}`);
