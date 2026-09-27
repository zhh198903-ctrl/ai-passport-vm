# Third-party notices

## Simulator

- Simulator shell, server and board models: MIT, © 2026 VOID001 — [LICENSE](LICENSE)
  (upstream [VOID001/FoloToy-Passport-Simulator](https://github.com/VOID001/FoloToy-Passport-Simulator)).
- ESP-EMU WebAssembly core (`public/wasm/pkg/`): Apache License 2.0 —
  [public/wasm/pkg/LICENSE](public/wasm/pkg/LICENSE).

## Bundled firmware images (`public/assets/firmware/`)

- `music-keychain.bin`, `answer-book.bin`, `folotoy-demo.bin`, `feishu-calendar-assistant.bin`:
  bundled by the upstream simulator from FoloToy
  ([FoloToy/ai-passport](https://github.com/FoloToy/ai-passport), MIT).
- `claude-control-demo.bin`, `claude-control.bin`: Claude Control watch firmware, built from a fork
  of [FoloToy/ai-passport](https://github.com/FoloToy/ai-passport) (MIT, © 2026 FoloToy). They contain:
  - ESP-IDF — Apache License 2.0
  - LVGL — MIT
  - espressif/esp_websocket_client, espressif/button, espressif/esp_codec_dev — Apache License 2.0
  - cJSON — MIT
  - Noto Sans SC (glyph subset rendered to bitmaps) — SIL Open Font License 1.1
  - Compatibility with the public Hardware Buddy BLE protocol published by Anthropic in
    [anthropics/claude-desktop-buddy](https://github.com/anthropics/claude-desktop-buddy) (MIT, © 2026 Anthropic, PBC)
