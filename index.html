// app.js — BBS terminal with command echo + Files Section (Option 2)

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

// Simple “screen mode” state
let mode = "main";            // "main" | "files"
let filesArea = "root";       // "root" | "ansi" | "docs" | "tools" | "archive"

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
  echoEl.textContent = (kbdEl.value || "").slice(-40);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function burst(out, ms=20){
  for (const l of out){
    println(l);
    // eslint-disable-next-line no-await-in-loop
    await sleep(ms);
  }
}

/* ------------------------------------------------------------------ */
/* Content: Files catalog                                               */
/* ------------------------------------------------------------------ */

// Edit these entries to match your repo/site.
// `url` should be a public link (GitHub Pages path, raw github, etc.)
const FILES = {
  ansi: [
    { id: "A1", name: "humaninbeta_logo.ans", size: "8 KB",  date: "2026-02-21", desc: "ANSI logo (3-color)", url: "files/ansi/humaninbeta_logo.ans" },
    { id: "A2", name: "beta_node_banner.ans", size: "12 KB", date: "2026-02-20", desc: "Renegade header banner", url: "files/ansi/beta_node_banner.ans" },
  ],
  docs: [
    { id: "D1", name: "homelab_readme.txt",   size: "6 KB",  date: "2026-02-10", desc: "Rebuild notes for humaninbeta", url: "files/docs/homelab_readme.txt" },
    { id: "D2", name: "changelog.txt",       size: "2 KB",  date: "2026-02-21", desc: "Site changes", url: "files/docs/changelog.txt" },
  ],
  tools: [
    { id: "T1", name: "status_probe.js",     size: "4 KB",  date: "2026-02-18", desc: "Simple uptime probe", url: "files/tools/status_probe.js" },
    { id: "T2", name: "ansi_render_notes.md",size: "3 KB",  date: "2026-02-19", desc: "Rendering notes", url: "files/tools/ansi_render_notes.md" },
  ],
  archive: [
    { id: "R1", name: "old_banner_01.ans",   size: "10 KB", date: "2026-01-05", desc: "Archived banner", url: "files/archive/old_banner_01.ans" },
  ],
};

// Helpers
function nowStamp(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function countAllFiles(){
  return Object.values(FILES).reduce((acc, arr) => acc + arr.length, 0);
}

function padRight(s, n){
  const str = String(s);
  return str.length >= n ? str.slice(0, n) : str + " ".repeat(n - str.length);
}

function fileRow(f){
  // A little Renegade-ish fixed columns
  // ID  NAME(24)            SIZE(6)   DATE(10)   DESC
  const id = padRight(f.id, 2);
  const name = padRight(f.name, 24);
  const size = padRight(f.size, 6);
  const date = padRight(f.date, 10);
  return `${C.y(id)}  ${C.c(name)} ${C.d(size)} ${C.d(date)} ${C.y(f.desc)}`;
}

function filesHeader(title){
  return [
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
    `${C.c("FILE SECTION")} ${C.d("::")} ${C.y(title)}`,
    `${C.d("Areas:")} ${C.y("4")}  ${C.d("Files:")} ${C.y(String(countAllFiles()))}  ${C.d("Updated:")} ${C.y(nowStamp())}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
  ];
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

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
    `${C.d("Type")} ${C.y("2")} ${C.d("for files. In files:")} ${C.y("A/B/C/D")} ${C.d("areas,")} ${C.y("L")} ${C.d("list,")} ${C.y("O <ID>")} ${C.d("open,")} ${C.y("B")} ${C.d("back.")}`,
  ];
}

async function showHelp(){
  await burst([
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
    `${C.y("HELP")} ${C.d(":: Commands")}`,
    `${C.c("1-5")}     ${C.d("open main menu items")}`,
    `${C.c("H")}       ${C.d("help")}`,
    `${C.c("CLEAR")}   ${C.d("clear terminal")}`,
    `${C.c("Q")}       ${C.d("disconnect")}`,
    "",
    `${C.y("FILES MODE")} ${C.d("(when in option 2)")}`,
    `${C.c("A/B/C/D")} ${C.d("select area (ANSI/DOCS/TOOLS/ARCHIVE)")}`,
    `${C.c("L")}       ${C.d("list files in area")}`,
    `${C.c("O <ID>")}  ${C.d("open file (prints URL/info)")}`,
    `${C.c("B")}       ${C.d("back to main menu")}`,
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

async function enterFiles(){
  mode = "files";
  filesArea = "root";
  await burst([
    ...filesHeader("EXPERIMENTS"),
    `${C.y("(A)")} ${C.c("ANSI / ART / LOGOS")}`,
    `${C.y("(B)")} ${C.c("DOCS / NOTES / BUILD LOG")}`,
    `${C.y("(C)")} ${C.c("TOOLS / SCRIPTS")}`,
    `${C.y("(D)")} ${C.c("ARCHIVE")} ${C.d("(read-only)")}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
    `${C.d("Commands:")} ${C.y("A/B/C/D")} ${C.d("area,")} ${C.y("L")} ${C.d("list,")} ${C.y("O <ID>")} ${C.d("open,")} ${C.y("B")} ${C.d("back")}`,
  ], 10);
}

function areaName(key){
  if (key === "ansi") return "ANSI / ART / LOGOS";
  if (key === "docs") return "DOCS / NOTES / BUILD LOG";
  if (key === "tools") return "TOOLS / SCRIPTS";
  if (key === "archive") return "ARCHIVE";
  return "EXPERIMENTS";
}

async function setFilesArea(key){
  filesArea = key;
  const title = areaName(key);
  await burst([
    ...filesHeader(title),
    `${C.d("Selected area:")} ${C.y(title)}`,
    `${C.d("Type")} ${C.y("L")} ${C.d("to list files,")} ${C.y("O <ID>")} ${C.d("to open,")} ${C.y("B")} ${C.d("back.")}`,
  ], 10);
}

async function listFiles(){
  if (filesArea === "root") {
    await burst([
      `${C.y("Select an area first:")} ${C.c("A")} ${C.d("ANSI,")} ${C.c("B")} ${C.d("DOCS,")} ${C.c("C")} ${C.d("TOOLS,")} ${C.c("D")} ${C.d("ARCHIVE")}`,
    ], 10);
    return;
  }

  const items = FILES[filesArea] || [];
  const title = areaName(filesArea);

  const out = [
    ...filesHeader(title),
    `${C.d("ID")}  ${C.d("NAME")}                     ${C.d("SIZE")}   ${C.d("DATE")}       ${C.d("DESC")}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
  ];

  if (items.length === 0) {
    out.push(`${C.y("No files available in this area.")}`);
  } else {
    for (const f of items) out.push(fileRow(f));
  }

  out.push(`${C.g("──────────────────────────────────────────────────────────────────────────────")}`);
  out.push(`${C.d("Use")} ${C.y("O <ID>")} ${C.d("to open a file, or")} ${C.y("B")} ${C.d("to go back.")}`);

  await burst(out, 8);
}

function findFileById(id){
  const up = String(id || "").trim().toUpperCase();
  for (const [area, items] of Object.entries(FILES)) {
    for (const f of items) {
      if (String(f.id).toUpperCase() === up) return { area, file: f };
    }
  }
  return null;
}

async function openFile(id){
  const hit = findFileById(id);
  if (!hit) {
    await burst([`${C.y("File not found.")} ${C.d("Try")} ${C.y("L")} ${C.d("to list, then")} ${C.y("O <ID>")}.`], 12);
    return;
  }

  const { area, file } = hit;
  const title = areaName(area);

  await burst([
    ...filesHeader(title),
    `${C.c("OPEN")} ${C.d("::")} ${C.y(file.name)}`,
    `${C.d("ID:")} ${C.y(file.id)}   ${C.d("Size:")} ${C.y(file.size)}   ${C.d("Date:")} ${C.y(file.date)}`,
    `${C.d("Desc:")} ${C.y(file.desc)}`,
    `${C.d("URL:")} ${C.c(file.url)}`,
    "",
    `${C.d("Note:")} ${C.y("Hook this to real downloads later (Workers, signed URLs, etc).")}`,
    `${C.g("──────────────────────────────────────────────────────────────────────────────")}`,
  ], 10);
}

/* ------------------------------------------------------------------ */
/* Command handling                                                     */
/* ------------------------------------------------------------------ */

async function handleMain(cmd){
  if (cmd === "1") return openSection("MESSAGE BASE :: THOUGHT LOGS");
  if (cmd === "2") return enterFiles();
  if (cmd === "3") return openSection("NODE CHAT :: LIVE SIGNAL");
  if (cmd === "4") return openSection("DOOR GAMES :: SIMULATIONS");
  if (cmd === "5") return openSection("BULLETINS :: CHANGELOG");
  return burst([`${C.y("Unknown command.")} ${C.d("Type")} ${C.y("H")} ${C.d("for help.")}`], 18);
}

async function handleFiles(raw){
  const up = raw.trim().toUpperCase();

  if (up === "B" || up === "BACK") {
    mode = "main";
    filesArea = "root";
    await burst([`${C.c("Returning to main menu...")}`], 12);
    await burst(mainMenuLines(), 10);
    return;
  }

  if (up === "A") return setFilesArea("ansi");
  if (up === "C") return setFilesArea("tools");
  if (up === "D") return setFilesArea("archive");

  // Note: "B" is Back, so DOCS uses "I" or "DOCS" to avoid collision.
  if (up === "I" || up === "DOCS") return setFilesArea("docs");

  if (up === "L" || up === "LIST") return listFiles();

  // O <ID>
  if (up.startsWith("O ") || up.startsWith("OPEN ")) {
    const parts = raw.trim().split(/\s+/);
    const id = parts[1] || "";
    if (!id) {
      await burst([`${C.y("Usage:")} ${C.c("O <ID>")} ${C.d("(example: O A1)")}`], 12);
      return;
    }
    return openFile(id);
  }

  await burst([
    `${C.y("FILES: Unknown command.")} ${C.d("Use")} ${C.y("A")} ${C.d("ANSI,")} ${C.y("I")} ${C.d("DOCS,")} ${C.y("C")} ${C.d("TOOLS,")} ${C.y("D")} ${C.d("ARCHIVE,")} ${C.y("L")} ${C.d("list,")} ${C.y("O <ID>")} ${C.d("open,")} ${C.y("B")} ${C.d("back.")}`,
  ], 10);
}

async function handle(cmdRaw){
  const cmd = cmdRaw.trim();
  const up = cmd.toUpperCase();
  if (!up) return;

  println(`${C.c(">")} ${C.y(up)}`);

  if (up === "H" || up === "HELP" || up === "?") return showHelp();
  if (up === "CLEAR" || up === "CLS") { clearScreen(); return burst(mode === "main" ? mainMenuLines() : filesHeader(areaName(filesArea)), 10); }
  if (up === "Q" || up === "QUIT" || up === "EXIT") {
    await burst([`${C.y("Disconnecting...")}`, `${C.d("NO CARRIER")}`], 40);
    return;
  }

  if (mode === "files") return handleFiles(cmd);
  return handleMain(up);
}

/* ------------------------------------------------------------------ */
/* Input handling                                                       */
/* ------------------------------------------------------------------ */

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
    await burst(mode === "main" ? mainMenuLines() : filesHeader(areaName(filesArea)), 10);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

  // If #kbd isn't focused, emulate input so keystrokes aren't lost.
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
      void burst(mode === "main" ? mainMenuLines() : filesHeader(areaName(filesArea)), 10);
    }
  }
});

window.addEventListener("resize", () => {
  measureMaxLines();
  render();
  if (typeof window.renderLogo === "function") window.renderLogo();
});

/* ------------------------------------------------------------------ */
/* Boot                                                                 */
/* ------------------------------------------------------------------ */

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
    `${C.d("Tip:")} ${C.y("H")} ${C.d("for help,")} ${C.y("2")} ${C.d("for files.")}`,
    "",
  ], 35);

  await burst(mainMenuLines(), 12);
  focusKbd();
  setEcho();
}

boot();
