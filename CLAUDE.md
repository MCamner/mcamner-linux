# CLAUDE.md

## Repository role

`mcamner-linux` boots a small Linux in the browser with the McAmner Journal
mounted as text files. It is a static page: `index.html`, `linux.js` and
vendored binaries in `vendor/`. How it works is in `README.md`; sources,
licenses and update steps for `vendor/` are in `vendor/LICENSES.md`.

Keep changes small and readable. Do not patch files in `vendor/`; work
around vendor behaviour in `linux.js` and say why in a comment.

## Contracts

- **Deep links.** `#{folder}/{name}` opens an entry only when it equals a
  `path` in the journal's `journal-text.json` exactly. Those paths are built
  in `journal_text()` in the journal's `tools/generate_site_metadata.py`
  (`{folder}/{number}-{slug}.txt`). A link built any other way fails
  silently: Linux boots without opening the entry.
- **The fragment is never a command.** Only an exact journal path without
  quotes is passed to the guest shell.

## Known vendor behaviour

Recheck these when updating `vendor/v86` or `vendor/xterm`:

- v86 writes the serial console to xterm one byte at a time, and xterm.js
  6.0 drops three-byte UTF-8 split that way (—, →, curly quotes).
  `linux.js` decodes with a streaming `TextDecoder` before writing.
- `emulator.create_file()` does not create directories. `linux.js` uses
  `emulator.fs9p.SearchPath` and `CreateDirectory`, which are internal to
  v86, not public API.
- Code in the `serial0-output-byte` listener runs on v86's I/O call stack,
  where a throw is not caught. Defer work there with `Promise.resolve().then`.

## Verifying

Serve the page next to the journal as described in `README.md` and boot it
in a browser: the prompt, `/journal`, `grep` and a deep link should work.
After replacing a file in `vendor/`, serve on a new port or clear the cache;
a reload on the same port can boot the old binary.
