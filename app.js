// Renegade-style flowing terminal that never scrolls the browser.
// We keep a fixed line buffer sized to the visible terminal viewport.

const termEl = document.getElementById("term");
const kbdEl  = document.getElementById("kbd");

// ANSI-ish color helpers (simple, no escape codes)
const C = {
  g: (s) => `<span class="g">${s}</span>`,
  c: (s) => `<span class="c">${s}</span>`,
  y: (s) => `<span class="y">${s}</span>`,
  d: (s) => `<span class="dim">${s}</span>`,
};

// Internal ring buffer of HTML lines
let lines = [];
let maxLines = 18; // will be recalculated based on viewport

function measureMaxLines() {
  // Compute how many lines fit in the terminal area.
  // Avoid code that changes layout height: we only set buffer length.
  const termBox = termEl.parentElement.getBoundingClientRect();
  const style = getComputedStyle(termEl);
  const lineHeight = parseFloat(style.lineHeight || "18");
  const paddingTop = parseFloat(getComputedStyle(termEl.parentElement).paddingTop || "0");
  const paddingBottom = parseFloat(getComputedStyle(termEl.parentElement).paddingBottom || "0");
  const usable = termBox.height - paddingTop - paddingBottom;
  const n = Math.max(10, Math.floor(usable / lineHeight) - 1); // keep breathing room
  maxLines = n;
}
window.addEventListener("resize", () => {
  measureMaxLines();
  render();
});

function render() {
  // Ensure we never grow beyond maxLines
  if (lines.length > maxLines) lines = lines.slice(lines.length - maxLines);
  termEl.innerHTML = lines.join("\n");
}

// Add one line (HTML)
function println(html) {
  lines.push(html);
  if (lines.length > maxLines) lines.shift();
  render();
}

// Burst-print multiple lines with a delay for “flow”
async function burst(outputLines, ms = 35) {
  for (const l of outputLines) {
    println(l);
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, ms));
  }
}

// Screens
function mainMenuLines() {
  return [
    `${C.c("Status:")}     ${C.y("BETA")}`,
    `${C.c("Stability:")}  ${C.y("UNKNOWN")}`,
    `${C.c("Evolution Cycle:")} ${C.y("ACTIVE")}`,
    "",
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
    `${C.y("(1)")} ${C.c("Message Base")}  ${C.d("::")} ${C.y("THOUGHT LOGS")}`,
    `${C.y("(2)")} ${C.c("File Section")}  ${C.d("::")} ${C.y("EXPERIMENTS")}`,
    `${C.y("(3)")} ${C.c("Node Chat")}     ${C.d("::")} ${C.y("LIVE SIGNAL")}`,
    `${C.y("(4)")} ${C.c("Door Games")}    ${C.d("::")} ${C.y("SIMULATIONS")}`,
    `${C.y("(5)")} ${C.c("Bulletins")}     ${C.d("::")} ${C.y("CHANGELOG")}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
  ];
}

async function boot() {
  measureMaxLines();
  render();

  await burst([
    `${C.c("CONNECT")} ${C.d("…")} ${C.y("2400")} ${C.d("bps")}`,
    `${C.c("HANDSHAKE")} ${C.d("…")} ${C.y("OK")}`,
    `${C.c("NEGOTIATE")} ${C.d("ANSI")} ${C.y("ON")}`,
    "",
    `${C.y("Welcome to")} ${C.c("HUMAN IN BETA")} ${C.d("— experimental systems online.")}`,
    `${C.d("Tip:")} ${C.y("H")} ${C.d("for help,")} ${C.y("1-5")} ${C.d("for menu.")}`,
    "",
  ], 40);

  await burst(mainMenuLines(), 18);

  kbdEl.focus();
}

function clearScreen() {
  lines = [];
  render();
}

async function showHelp() {
  await burst([
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
    `${C.y("HELP")} ${C.d(":: Commands")}`,
    `${C.c("1-5")} ${C.d(" open menu items")}`,
    `${C.c("H")}   ${C.d(" help")}`,
    `${C.c("CLEAR")} ${C.d(" clear terminal window")}`,
    `${C.c("Q")}   ${C.d(" disconnect")}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
  ], 12);
}

async function openSection(name) {
  await burst([
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
    `${C.c("Entering:")} ${C.y(name)} ${C.d("…")}`,
    `${C.d("Loading modules")} ${C.d("…")} ${C.y("OK")}`,
    `${C.d("Note:")} ${C.y("stub")} ${C.d("(add real content later)")}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
  ], 18);
}

// Command handling
async function handle(cmdRaw) {
  const cmd = cmdRaw.trim().toUpperCase();
  if (!cmd) return;

  // Echo the command like a BBS would
  println(`${C.c(">")} ${C.y(cmd)}`);

  if (cmd === "H" || cmd === "HELP" || cmd === "?") return showHelp();
  if (cmd === "CLEAR" || cmd === "CLS") { clearScreen(); return burst(mainMenuLines(), 10); }
  if (cmd === "Q" || cmd === "QUIT" || cmd === "EXIT") {
    await burst([`${C.y("Disconnecting...")}`, `${C.d("NO CARRIER")}`], 40);
    return;
  }

  if (cmd === "1") return openSection("MESSAGE BASE :: THOUGHT LOGS");
  if (cmd === "2") return openSection("FILE SECTION :: EXPERIMENTS");
  if (cmd === "3") return openSection("NODE CHAT :: LIVE SIGNAL");
  if (cmd === "4") return openSection("DOOR GAMES :: SIMULATIONS");
  if (cmd === "5") return openSection("BULLETINS :: CHANGELOG");

  // unknown
  await burst([`${C.y("Unknown command.")} ${C.d("Type")} ${C.y("H")} ${C.d("for help.")}`], 18);
}

// Keyboard capture
document.addEventListener("pointerdown", () => kbdEl.focus());

kbdEl.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const val = kbdEl.value;
    kbdEl.value = "";
    await handle(val);
  } else if (e.key === "Escape") {
    kbdEl.value = "";
    // quick “return to main” feel: clear + redraw menu
    clearScreen();
    await burst(mainMenuLines(), 10);
  }
});

// Start
renderLogo();
boot();
