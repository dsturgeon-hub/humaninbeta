// app.js — BBS terminal with visible command echo + reliable input capture

const termEl = document.getElementById("term");
const kbdEl  = document.getElementById("kbd");
const echoEl = document.getElementById("cmdEcho");

const C = {
  g: (s) => `<span class="g">${s}</span>`,
  c: (s) => `<span class="c">${s}</span>`,
  y: (s) => `<span class="y">${s}</span>`,
  d: (s) => `<span class="dim">${s}</span>`,
};

let lines = [];
let maxLines = 18;

function measureMaxLines(){
  const box = termEl.parentElement.getBoundingClientRect();
  const preStyle = getComputedStyle(termEl);
  const lineHeight = parseFloat(preStyle.lineHeight || "18");
  const padTop = parseFloat(getComputedStyle(termEl.parentElement).paddingTop || "0");
  const padBot = parseFloat(getComputedStyle(termEl.parentElement).paddingBottom || "0");
  const usable = box.height - padTop - padBot;
  maxLines = Math.max(10, Math.floor(usable / lineHeight) - 1);
}

function render(){
  if (lines.length > maxLines) lines = lines.slice(lines.length - maxLines);
  termEl.innerHTML = lines.join("\n");
}

function println(html){
  lines.push(html);
  if (lines.length > maxLines) lines.shift();
  render();
}

function clearScreen(){
  lines = [];
  render();
}

function setEcho(){
  if (!echoEl) return;
  withholdingScroll();
  echoEl.textContent = (kbdEl.value || "").slice(-40);
}

// Keeps prompt stable (no layout jump) — noop placeholder for future if needed
function withholdingScroll(){}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function burst(out, ms=20){
  for (const l of out){
    println(l);
    // eslint-disable-next-line no-await-in-loop
    await sleep(ms);
  }
}

function mainMenuLines(){
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

async function showHelp(){
  await burst([
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
    `${C.y("HELP")} ${C.d(":: Commands")}`,
    `${C.c("1-5")}   ${C.d("open menu items")}`,
    `${C.c("H")}     ${C.d("help")}`,
    `${C.c("CLEAR")} ${C.d("clear terminal")}`,
    `${C.c("Q")}     ${C.d("disconnect")}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
  ], 12);
}

async function openSection(name){
  await burst([
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
    `${C.c("Entering:")} ${C.y(name)} ${C.d("…")}`,
    `${C.d("Loading modules")} ${C.d("…")} ${C.y("OK")}`,
    `${C.d("Note:")} ${C.y("stub")} ${C.d("(add real content later)")}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
  ], 16);
}

async function handle(cmdRaw){
  const cmd = cmdRaw.trim().toUpperCase();
  if (!cmd) return;

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

  await burst([`${C.y("Unknown command.")} ${C.d("Type")} ${C.y("H")} ${C.d("for help.")}`], 18);
}

// ---- Input handling (bulletproof) ----
function focusKbd(){
  setTimeout(() => kbdEl.focus(), 0);
}

function clearInput(){
  kbdEl.value = "";
  setEcho();
}

document.addEventListener("pointerdown", focusKbd);
document.addEventListener("touchstart", focusKbd, { passive: true });

kbdEl.addEventListener("input", setEcho);
kbdEl.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const val = kbdEl.value;
    clearInput();
    await handle(val);
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    clearInput();
    clearScreen();
    await burst(mainMenuLines(), 10);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

  // If #kbd isn't focused, we emulate the input so no keystrokes are lost.
  if (document.activeElement !== kbdEl) {
    e.preventDefault();
    focusKbd();

    if (e.key.length === 1) {
      kbdEl.value += e.key;
      setEcho();
      return;
    }
    if (e.key === "Backspace") {
      kbdEl.value = kbdEl.value.slice(0, -1);
      setEcho();
      return;
    }
    if (e.key === "Enter") {
      const val = kbdEl.value;
      clearInput();
      void handle(val);
      return;
    }
    if (e.key === "Escape") {
      clearInput();
      clearScreen();
      void burst(mainMenuLines(), 10);
    }
  }
});

window.addEventListener("resize", () => {
  measureMaxLines();
  render();
  if (typeof window.renderLogo === "function") window.renderLogo();
});

// ---- Boot ----
async function boot(){
  measureMaxLines();
  render();

  if (typeof window.renderLogo === "function") window.renderLogo();

  await burst([
    `${C.c("CONNECT")} ${C.d("…")} ${C.y("2400")} ${C.d("bps")}`,
    `${C.c("HANDSHAKE")} ${C.d("…")} ${C.y("OK")}`,
    `${C.c("NEGOTIATE")} ${C.d("ANSI")} ${C.y("ON")}`,
    "",
    `${C.y("Welcome to")} ${C.c("HUMAN IN BETA")} ${C.d("— experimental systems online.")}`,
    `${C.d("Tip:")} ${C.y("H")} ${C.d("for help,")} ${C.y("1-5")} ${C.d("for menu.")}`,
    "",
  ], 35);

  await burst(mainMenuLines(), 12);
  focusKbd();
  setEcho();
}

boot();
