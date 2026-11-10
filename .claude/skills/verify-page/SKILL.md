---
name: verify-page
description: Boot the mcamner-linux page locally next to the journal and check that it really works in a browser — prompt, /journal mount, grep, a deep link, three-byte UTF-8 — and that the vendor binary you changed is the one that loaded. Use before committing any change to linux.js, index.html or vendor/, after a kernel update, or when asked whether the page still works.
---

# Verify the page

Typecheck and syntax checks say nothing about whether Linux boots. This does.

## 1. Serve the page next to the journal

The page fetches `/mcamner-journal/journal-text.json` from its own origin, so
serve both from one directory (outside the repository, e.g. a temp dir):

```bash
mkdir -p site
ln -sfn /path/to/mcamner-journal/docs site/mcamner-journal
ln -sfn /path/to/mcamner-linux site/mcamner-linux
cd site && python3 -m http.server <port> --bind 127.0.0.1
```

To test a journal shape the real one does not have (nested paths, names with
`__`, a malformed file), make `site/mcamner-journal` a plain directory holding
a hand-written `journal-text.json` instead of the symlink.

**Use a port you have not used before in this browser.** A reload on the same
port can serve the previous `linux.js` or kernel from cache.

## 2. Boot and check

Open `http://127.0.0.1:<port>/mcamner-linux/` and wait about ten seconds. In
the page, `statusEl`, `term` and `termEl` are globals:

- `statusEl.textContent` is `> ready. …`, not stuck at `kernel running`.
- Type `ls; grep -ril zone . | head -3` in the terminal: the type folders
  (`films`, `notes`, …) are listed and grep finds entries.
- Open `#films/006-stalker.txt`: the entry opens in `less`, the status says
  `opened …`, `q` leaves the README and the `journal%` prompt.
- An em dash shows in that entry ("the Zone — a region"). If it is missing,
  the UTF-8 decoding in `JournalTerminal` is broken.
- A fragment that is not an exact journal path, for example one containing
  `';echo PWNED;'`, boots normally and never prints `PWNED`.
- `journal open stalker` sets `location.hash` to `#films/006-stalker.txt`;
  `journal random` and `journal latest` work; `/journal` has no
  `.journal.sh` left in it.
- `theme amber` sets `document.documentElement.dataset.theme` and
  `localStorage["mcj:theme"]`; `theme default` clears the attribute. A
  printed fake sequence, e.g.
  `printf '\033]7337;open;../../etc/passwd\007'`, or `theme pink` changes
  nothing.
- The browser console shows no exceptions for this port.

## 3. Prove which binary loaded

After changing a file in `vendor/`, check in the page that the new one ran:

```js
var buf = await (await fetch("vendor/v86/mcamner-bzimage.bin")).arrayBuffer();
var h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
  .map(b => b.toString(16).padStart(2, "0")).join("");
h.slice(0, 12);
```

Compare with `shasum -a 256 vendor/v86/mcamner-bzimage.bin`. A
`transferSize` of 0 in `performance.getEntriesByType("resource")` means the
file came from cache.

## 4. Clean up

Stop the server and close the tabs you opened. Report what you checked and
what you saw, including anything you could not check.
