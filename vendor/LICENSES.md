# Vendored files

Everything the page runs is served from this repository. Nothing is loaded
from a CDN at runtime. Checksums are in `SHA256SUMS`.

| File | Bytes | Source | License |
|---|---:|---|---|
| `v86/libv86.js` | 359 857 | [copy/v86](https://github.com/copy/v86) release `latest`, tag commit `315b2b0b`, fetched 2026-11-10 | BSD-2-Clause, see `v86/LICENSE` |
| `v86/v86.wasm` | 2 007 347 | same release | BSD-2-Clause, see `v86/LICENSE` |
| `v86/seabios.bin` | 131 072 | `bios/seabios.bin` in copy/v86 at `315b2b0b` | LGPL-3.0, see `v86/COPYING.LESSER`. Source: [SeaBIOS](https://www.seabios.org/); build config `bios/seabios.config` and `bios/fetch-and-build-seabios.sh` in copy/v86 |
| `v86/vgabios.bin` | 36 352 | `bios/vgabios.bin` in copy/v86 at `315b2b0b` | LGPL, see `v86/COPYING.LESSER`. Built by the same script as SeaBIOS |
| `v86/buildroot-bzimage68.bin` | 10 068 480 | `https://i.copy.sh/buildroot-bzimage68.bin`, fetched 2026-11-10. Linux 6.8.12 bzImage with an embedded Buildroot root filesystem (BusyBox, Lua) | GPL-2.0 (kernel, BusyBox) and others. **Open: see below** |
| `xterm/xterm.js`, `xterm/xterm.css` | 488 663, 7 112 | npm `@xterm/xterm@6.0.0` | MIT, see `xterm/LICENSE` |

## Open: source for the kernel image

`buildroot-bzimage68.bin` is a GPL binary. Redistributing it carries an
obligation to make the corresponding source available. The v86 project
distributes the image but does not publish its Buildroot configuration or
the exact source it was built from, and that has not been confirmed here.

Ways to close this:

1. Ask the v86 maintainers for the Buildroot config and source, and link or
   mirror it here.
2. Build an image with Buildroot (or `darin755/browser-buildroot`) and publish
   the config and source next to it.

Until one of those is done, treat the kernel image as not fully compliant.

## Updating

1. Download the new files into `vendor/`.
2. Update the sizes and sources in this file and run
   `cd vendor && shasum -a 256 v86/*.bin v86/*.js v86/*.wasm xterm/*.js xterm/*.css > SHA256SUMS`.
3. Boot the page locally and check that the prompt, the mount and `grep` still work.
