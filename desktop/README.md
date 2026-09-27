# Desktop build (Windows single-file executable)

The same simulator as `npm start`, packaged so that a double-click runs it: no Node.js, no
install. The launcher starts the server on `127.0.0.1` (port 4190, or any free port if that is
taken), opens it maximized in a Google Chrome app window (Microsoft Edge when Chrome is not
installed) with its own profile, and quits when that window is closed. A second double-click just
opens another window onto the running copy. With neither browser installed it opens the default
browser instead and keeps serving until ended from Task Manager.

The executable is a GUI program (no console window); its messages go to
`%LOCALAPPDATA%\AIPassportVM\launcher.log`.

Differences from the hosted site: local firmware upload is on, the emulated Wi-Fi may reach
private addresses (so a simulated watch can talk to a desktop app on the same computer), and
analytics are off.

## Build

```bash
npm install
npm test                  # the upstream suite, including firmware catalog checks
npm run build:exe         # → dist-exe/<name>.exe (~110 MB: Node runtime + embedded web files)
```

`desktop/build-exe.mjs` bundles `desktop/launcher.mjs` with esbuild into one CommonJS script,
embeds every file under `public/` (except the README demo videos) as Node single-executable
assets, and injects the blob into a copy of the running `node.exe` with postject. The injected
executable is unsigned; Windows SmartScreen will ask once.

Run from source without packaging: `npm run desktop`.

## Bundled firmware presets

| URL id | Preset | Source |
| --- | --- | --- |
| 1–4 | upstream demos | unchanged |
| 5 | Claude Control 演示 (offline demo, **default**) | Claude Control firmware, binary only (proprietary) |
| 6 | Claude Control (connect to a computer) | Claude Control firmware, binary only (proprietary); carries no pairing data |

The page boots preset 5 (Claude Control 演示) by default; any preset or a local image can be
loaded from the sidebar. To refresh a preset from a new firmware build:

```bash
node desktop/update-firmware.mjs claude-control-demo path/to/merged-binary.bin
```

It copies the image and updates the catalog (bytes, sha256), the size shown in the sidebar and
the hash pinned in `test/presets.test.mjs`.

### Pairing the "connect" firmware

That image contains no pairing data. In the simulator's UART console type

```
pair <pair-id> <token> [ws://<computer-ip>:47832/dev]
```

The watch stores it and reboots. `status` shows what is stored (never the token), `unpair`
clears it.
