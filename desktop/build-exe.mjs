// Build the one-file Windows executable: node desktop/build-exe.mjs  (or: npm run build:exe)
//
// 1. esbuild bundles desktop/launcher.mjs + server into one CommonJS script (Node's single
//    executable applications run CommonJS);
// 2. every file under public/ (except the README demo videos) becomes an embedded asset;
// 3. node --experimental-sea-config makes the blob, postject injects it into a copy of node.exe.
// Output: dist-exe/AI-Passport-VM.exe
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist-exe");
const exeName = "AI-Passport-VM.exe";
const EXCLUDE = new Set(["assets/demo/folotoy-emu.gif", "assets/demo/folotoy-emu.mp4"]);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1 — bundle. server.mjs derives its public/ directory from import.meta.url; inside the
// executable that path is never used (assets come from the blob), it only has to parse.
const bundle = path.join(out, "launcher.cjs");
await build({
  entryPoints: [path.join(root, "desktop", "launcher.mjs")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: bundle,
  define: { "import.meta.url": JSON.stringify("file:///C:/ai-passport-simulator/server.mjs") },
  logLevel: "warning",
});

// 2 — assets
const assets = {};
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    const relative = path.relative(path.join(root, "public"), full).split(path.sep).join("/");
    if (EXCLUDE.has(relative)) continue;
    assets[`public/${relative}`] = full;
  }
}
walk(path.join(root, "public"));
const assetBytes = Object.values(assets).reduce((sum, file) => sum + statSync(file).size, 0);

// 3 — blob + inject
const blob = path.join(out, "sea-prep.blob");
const config = path.join(out, "sea-config.json");
writeFileSync(config, JSON.stringify({
  main: bundle,
  output: blob,
  disableExperimentalSEAWarning: true,
  useCodeCache: false,
  assets,
}, null, 2));
execFileSync(process.execPath, ["--experimental-sea-config", config], { stdio: "inherit" });

const exe = path.join(out, exeName);
copyFileSync(process.execPath, exe);
execFileSync(process.execPath, [
  path.join(root, "node_modules", "postject", "dist", "cli.js"),
  exe, "NODE_SEA_BLOB", blob,
  "--sentinel-fuse", "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
  "--overwrite",
], { stdio: "inherit" });

// 4 — no console window: mark the executable as a Windows GUI program. The PE optional header's
// Subsystem field (offset 68 for both PE32 and PE32+) goes from 3 (console) to 2 (GUI). The
// launcher logs to a file instead (desktop/launcher.mjs).
const image = readFileSync(exe);
const pe = image.readUInt32LE(0x3c);
if (image.readUInt32LE(pe) !== 0x00004550) throw new Error("not a PE image");   // "PE\0\0"
const subsystemAt = pe + 24 + 68;
const subsystem = image.readUInt16LE(subsystemAt);
if (subsystem !== 3) throw new Error(`unexpected PE subsystem ${subsystem} (expected 3, console)`);
image.writeUInt16LE(2, subsystemAt);
writeFileSync(exe, image);

rmSync(blob);
console.log(`${exeName}: ${(statSync(exe).size / 1024 / 1024).toFixed(1)} MB ` +
  `(${Object.keys(assets).length} assets, ${(assetBytes / 1024 / 1024).toFixed(1)} MB)`);
