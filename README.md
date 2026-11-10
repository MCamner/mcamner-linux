# mcamner-linux

A real Linux booting in the browser, with the
[McAmner Journal](https://mcamner.github.io/mcamner-journal/) mounted as
plain text files. Opened from the journal's prompt with `/linux`.

Live: <https://mcamner.github.io/mcamner-linux/>

## How it works

- [v86](https://github.com/copy/v86) emulates an x86 machine in WebAssembly
  and boots a small Linux on its serial console. The kernel and its root
  filesystem are built here from `buildroot/` by the `kernel` workflow, which
  publishes each image as a release together with its full source.
  [xterm.js](https://xtermjs.org/) draws that console.
- The page fetches `/mcamner-journal/journal-text.json`, which the journal's
  generator writes from its posts. Each entry becomes a file in the
  emulator's 9p filesystem, which the guest already mounts on `/mnt`.
  `/journal` links there, sorted into `notes/`, `films/`, `books/` and so on.
- Both sites live on `mcamner.github.io`, so they share an origin. That is
  why the fetch needs no CORS and why `/theme` in the journal carries over:
  the page reads the same `mcj:theme` key.

- A link with an entry's path as the fragment,
  `https://mcamner.github.io/mcamner-linux/#films/006-stalker.txt`, boots
  and opens that entry in `less`; `q` leaves the shell in `/journal`. Only
  a path that exists in the journal is accepted, never a command; anything
  else boots as usual.

Everything runs in the visitor's tab. There is no network inside the guest,
no backend, and nothing is saved between visits.

Why a separate repository: the kernel image and the emulator are about
8 MB of binaries. Keeping them here keeps the journal's history small, and
this history can be rewritten when the binaries change.

## Run locally

The page expects the journal on the same origin, so serve both from one
directory:

    mkdir site
    ln -s /path/to/mcamner-journal/docs site/mcamner-journal
    ln -s /path/to/mcamner-linux site/mcamner-linux
    cd site && python3 -m http.server 8686
    # open http://localhost:8686/mcamner-linux/

Without the journal next to it, Linux still boots; `/journal` then holds
only the README.

## Files

- `index.html`: the page.
- `linux.js`: boot, progress, writing the journal into 9p, mounting.
- `vendor/`: v86, BIOS, kernel image and xterm.js. Sources, licenses and how
  to update them are in [vendor/LICENSES.md](vendor/LICENSES.md).
