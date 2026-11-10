"use strict";

// Boots buildroot Linux in v86 on the serial console, then writes the journal
// into the guest's 9p filesystem and mounts it at /journal.

var JOURNAL_URL = "https://mcamner.github.io/mcamner-journal/";
var TEXT_URL = "/mcamner-journal/journal-text.json"; // same origin, see README
var PROMPT = "~% ";
var COLS = 80;

var statusEl = document.getElementById("status");
var termEl = document.getElementById("term");

function status(text, isError) {
  statusEl.textContent = "> " + text;
  statusEl.classList.toggle("is-error", !!isError);
}

function mb(bytes) { return (bytes / 1048576).toFixed(1); }

// Fixed 80 columns; font size and row count follow the available space.
function layout() {
  var style = getComputedStyle(termEl);
  var width = termEl.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  var height = termEl.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  var fontSize = Math.max(7, Math.min(16, Math.floor(width / (COLS * 0.62))));
  var rows = Math.max(10, Math.floor(height / Math.ceil(fontSize * 1.2)));
  return { fontSize: fontSize, rows: rows };
}

var term = null;

// v86 builds the terminal itself; the documented hook is xterm_lib, so a
// subclass adds the journal's palette and the size.
function JournalTerminal(options) {
  var size = layout();
  term = new window.Terminal(Object.assign({}, options, {
    cols: COLS,
    rows: size.rows,
    fontSize: size.fontSize,
    lineHeight: 1.2,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    cursorBlink: true,
    theme: {
      background: "#123b80",
      foreground: "#f7f3ed",
      cursor: "#e57b4f",
      cursorAccent: "#123b80",
      selectionBackground: "rgba(229, 123, 79, 0.45)",
      black: "#0d438f", brightBlack: "#c9c1b4",
      red: "#ff9a86", brightRed: "#ffb8a8",
      green: "#9ad98c", brightGreen: "#bdf0b0",
      yellow: "#ffd37f", brightYellow: "#ffe3a8",
      blue: "#a9c8ff", brightBlue: "#cfe0ff",
      magenta: "#e9b0ff", brightMagenta: "#f3d0ff",
      cyan: "#93e6f2", brightCyan: "#c0f3fa",
      white: "#f7f3ed", brightWhite: "#ffffff"
    }
  }));
  return term;
}

function readme(count) {
  return [
    "McAmner Journal, mounted as plain text.",
    "",
    count ? count + " entries, one file each, sorted by type:" : "The journal could not be loaded this time.",
    "",
    "  ls                      what is here",
    "  ls films                one folder per type",
    "  cat films/006-*         read an entry",
    "  grep -ril zone .        which entries mention a word",
    "  ls */                   every entry",
    "",
    "This is a real Linux kernel running in your browser tab. Nothing",
    "leaves the tab, there is no network, and nothing is saved.",
    "Read the journal itself: " + JOURNAL_URL,
    ""
  ].join("\n");
}

function start(journal) {
  if (typeof WebAssembly !== "object") {
    status("this browser has no WebAssembly, so Linux cannot run here.", true);
    return;
  }

  var emulator = new V86({
    wasm_path: "vendor/v86/v86.wasm",
    bios: { url: "vendor/v86/seabios.bin" },
    vga_bios: { url: "vendor/v86/vgabios.bin" },
    bzimage: { url: "vendor/v86/buildroot-bzimage68.bin", async: false },
    filesystem: {},
    cmdline: "tsc=reliable mitigations=off random.trust_cpu=on",
    memory_size: 128 * 1024 * 1024,
    autostart: true,
    disable_keyboard: true,
    serial_console: { type: "xtermjs", container: termEl, xterm_lib: JournalTerminal }
  });

  emulator.add_listener("download-progress", function (e) {
    var name = e.file_name.split("/").pop();
    if (e.lengthComputable && e.total) {
      status("boot: loading " + name + " … " + mb(e.loaded) + " / " + mb(e.total) + " MB");
    } else {
      status("boot: loading " + name + " … " + mb(e.loaded) + " MB");
    }
  });

  emulator.add_listener("download-error", function (e) {
    status("boot: could not load " + e.file_name.split("/").pop() + ". Reload to try again.", true);
  });

  emulator.add_listener("emulator-started", function () {
    status("boot: kernel running …");
  });

  var tail = "";
  var mounted = false;
  emulator.add_listener("serial0-output-byte", function (byte) {
    if (mounted) return;
    tail = (tail + String.fromCharCode(byte)).slice(-16);
    if (!tail.endsWith(PROMPT)) return;
    mounted = true;
    mountJournal(emulator, journal).then(function () {
      status("ready. type below; the journal is in /journal.");
      if (term) term.focus();
    }, function () {
      status("linux is up, but the journal could not be mounted.", true);
    });
  });
}

// create_file does not create directories, so files land flat as
// "films__006-stalker.txt" and the guest sorts them into folders.
function mountJournal(emulator, journal) {
  var encoder = new TextEncoder();
  var files = journal ? journal.files : [];
  var writes = files.map(function (f) {
    return emulator.create_file(f.path.replace("/", "__"), encoder.encode(f.text));
  });
  writes.push(emulator.create_file("README.txt", encoder.encode(readme(files.length))));

  return Promise.all(writes).then(function () {
    var rows = term ? term.rows : 24;
    emulator.serial0_send(
      // The buildroot image already mounts host9p on /mnt; mount only if not.
      "(grep -q ' /mnt 9p' /proc/mounts || mount -t 9p -o trans=virtio,version=9p2000.L host9p /mnt)" +
      " && ln -sfn /mnt /journal && cd /journal" +
      " && for f in *__*; do d=${f%%__*}; mkdir -p $d; mv \"$f\" \"$d/${f#*__}\"; done;" +
      " stty rows " + rows + " cols " + COLS + ";" +
      " alias exit='echo \"back to the journal: " + JOURNAL_URL + "\"';" +
      " clear; cat README.txt\n"
    );
  });
}

fetch(TEXT_URL)
  .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
  .catch(function () { return null; })
  .then(start);
