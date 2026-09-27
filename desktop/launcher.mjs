// Desktop launcher: one double-click runs the simulator locally.
//
// Starts the same server as `npm start` on 127.0.0.1 (local firmware upload on, private network
// allowed so a simulated watch can reach a desktop app on this computer), then opens it in a
// Google Chrome app window (Microsoft Edge when Chrome is not installed) with its own profile.
// Closing that window quits.
//
// Inside the single executable (desktop/build-exe.mjs) the web files are embedded assets;
// run from source with `node desktop/launcher.mjs` it serves public/ from disk.
// The executable is a GUI program (no console window): messages go to
// %LOCALAPPDATA%\AIPassportVM\launcher.log, and to the console too when there is one.
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sea from "node:sea";

import { createAppServer, diskAssets } from "../server.mjs";

const PREFERRED_PORT = 4190;
const APP_NAME = "AI Passport VM";
// Only this build ships the Claude Control presets: a server on 4190 that has this file is a
// running copy of us (an upstream `npm start` on the same port is not, and gets a new port).
const PROBE_PATH = "/assets/firmware/claude-control-demo.bin";

const home = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "AIPassportVM");
mkdirSync(home, { recursive: true });
const logFile = path.join(home, "launcher.log");

function log(...parts) {
  const line = `${new Date().toISOString()} ${parts.join(" ")}\n`;
  try {
    appendFileSync(logFile, line);
  } catch {
    // the log is a convenience; never let it stop the simulator
  }
  try {
    process.stdout.write(line);
  } catch {
    // no console (GUI executable)
  }
}

// Serve public/ from the executable's embedded assets (keys are "public/<path>").
const embeddedAssets = {
  async lookup(pathname) {
    let decoded;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    const relative = decoded === "/" ? "/index.html" : decoded;
    if (relative.includes("..") || relative.includes("\\")) return null;
    let raw;
    try {
      raw = sea.getRawAsset(`public${relative}`);
    } catch {
      return null;
    }
    const body = Buffer.from(raw);
    return { size: body.byteLength, open: () => body };
  },
};

// Only errors are recorded; the access log of a local single-user app is noise.
const quietLogger = {
  info() {},
  warn() {},
  error(event, fields) {
    log(`[${event}]`, fields?.message ?? fields?.error ?? "");
  },
};

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve(server.address().port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}

async function alreadyRunning(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}${PROBE_PATH}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Chrome first (what the simulator is developed and tested in), Edge as the fallback that every
// Windows 10/11 machine has. Both are Chromium, so the emulator behaves the same in either.
function findBrowser() {
  // SIMULATOR_BROWSER=<full path to chrome.exe / msedge.exe> picks one explicitly.
  const chosen = process.env.SIMULATOR_BROWSER;
  if (chosen && existsSync(chosen)) return chosen;
  const roots = [
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.LOCALAPPDATA,
  ].filter(Boolean);
  const candidates = [
    ...roots.map((root) => path.join(root, "Google", "Chrome", "Application", "chrome.exe")),
    ...roots.map((root) => path.join(root, "Microsoft", "Edge", "Application", "msedge.exe")),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

// Neither browser: hand the address to the default browser. There is then no window to watch,
// so the server keeps running until the user ends it (documented in the README).
function openDefaultBrowser(url) {
  spawn("cmd.exe", ["/c", "start", "", url], { stdio: "ignore", detached: true, windowsHide: true }).unref();
}

function openWindow(url) {
  const browser = findBrowser();
  if (!browser) {
    log("Chrome / Edge not found; opening the default browser at", url);
    openDefaultBrowser(url);
    return null;
  }
  const profile = path.join(home, "browser");
  mkdirSync(profile, { recursive: true });
  const child = spawn(browser, [
    `--app=${url}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--start-maximized",                     // the page layout wants more than 1280 px
    // Closing the window must end the browser process (that is how the launcher knows to quit):
    // no background mode, no extension renderers in this private profile.
    "--disable-background-mode",
    "--disable-extensions",
    // The emulator must keep running when the window is covered or in the background.
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-background-timer-throttling",
    "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion",
    "--autoplay-policy=no-user-gesture-required",
  ], { stdio: "ignore" });
  child.on("error", (error) => {
    log(`cannot start ${browser}: ${error.message}; opening the default browser`);
    openDefaultBrowser(url);
  });
  log("window:", browser);
  return child;
}

async function main() {
  // A second double-click: the first copy keeps serving; just open another window onto it.
  if (await alreadyRunning(PREFERRED_PORT)) {
    const url = `http://127.0.0.1:${PREFERRED_PORT}/`;
    log(`${APP_NAME} is already running at ${url}`);
    openWindow(url);
    return;
  }

  const server = createAppServer({
    allowLocalFirmwareUpload: true,
    analytics: null,
    assets: sea.isSea() ? embeddedAssets : diskAssets,
    logger: quietLogger,
    networkBridge: { allowPrivate: true },
  });
  let port;
  try {
    port = await listen(server, PREFERRED_PORT);
  } catch {
    port = await listen(server, 0);           // 4190 is taken by something else: any free port
  }
  const url = `http://127.0.0.1:${port}/`;   // the page boots Claude Control by default
  log(`${APP_NAME} is running at ${url}`);

  const child = openWindow(url);
  child?.on("exit", () => {
    log("window closed; quitting");
    server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  log("fatal:", error?.stack ?? String(error));
  process.exitCode = 1;
});
