# Vendored files

Everything the page runs is served from this repository. Nothing is loaded
from a CDN at runtime. Checksums are in `SHA256SUMS`.

| File | Bytes | Source | License |
|---|---:|---|---|
| `v86/libv86.js` | 359 857 | [copy/v86](https://github.com/copy/v86) release `latest`, tag commit `315b2b0b`, fetched 2026-11-10 | BSD-2-Clause, see `v86/LICENSE` |
| `v86/v86.wasm` | 2 007 347 | same release | BSD-2-Clause, see `v86/LICENSE` |
| `v86/seabios.bin` | 131 072 | `bios/seabios.bin` in copy/v86 at `315b2b0b` | LGPL-3.0, see `v86/COPYING.LESSER`. Source: [SeaBIOS](https://www.seabios.org/); build config `bios/seabios.config` and `bios/fetch-and-build-seabios.sh` in copy/v86 |
| `v86/vgabios.bin` | 36 352 | `bios/vgabios.bin` in copy/v86 at `315b2b0b` | LGPL, see `v86/COPYING.LESSER`. Built by the same script as SeaBIOS |
| `v86/mcamner-bzimage.bin` | 5 927 424 | Built in this repository from `buildroot/` by `.github/workflows/kernel.yml`, release [`kernel-2026.02.3-5-defconfig-nossp`](https://github.com/MCamner/mcamner-linux/releases/tag/kernel-2026.02.3-5-defconfig-nossp) (run 42741854415, commit `3ec7fbc`). Linux 6.18.7 with an embedded Buildroot 2026.02.3 root filesystem (BusyBox, musl) | GPL-2.0 (kernel, BusyBox), MIT (musl) and others. Full list and source: see below |
| `xterm/xterm.js`, `xterm/xterm.css` | 488 663, 7 112 | npm `@xterm/xterm@6.0.0` | MIT, see `xterm/LICENSE` |

## Source for the kernel image

The complete corresponding source for `mcamner-bzimage.bin` is published
next to it in the same release:

- `legal-info.tar`: every source tarball and patch that went into the image
  (kernel, BusyBox, musl, toolchain), license texts and a manifest of
  packages and licenses, produced by Buildroot's `make legal-info`.
- `defconfig` and `linux.config`: the Buildroot and kernel configuration.

The scripts to rebuild it are in this repository: `buildroot/` and
`.github/workflows/kernel.yml`.

An earlier version of this repository served the v86 project's
`buildroot-bzimage68.bin`, whose source was not available. It was removed
from the history on 2026-11-10.

## Updating

1. Download the new files into `vendor/`. For the kernel, run the `kernel`
   workflow and copy `mcamner-bzimage.bin` from the release it publishes.
2. Update the sizes and sources in this file and run
   `cd vendor && shasum -a 256 v86/*.bin v86/*.js v86/*.wasm xterm/*.js xterm/*.css > SHA256SUMS`.
3. Boot the page locally and check that the prompt, the mount and `grep` still work.
