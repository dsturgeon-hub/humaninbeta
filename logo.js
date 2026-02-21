function renderLogo() {
  const canvas = document.getElementById("logo");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Make canvas resolution match CSS size for sharpness (but still pixelated).
  const cssW = Math.min(canvas.parentElement.clientWidth, 980);
  const cssH = Math.round(cssW * (220 / 1200));
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ---- Palette (matches your reference: green -> cyan -> yellow) ----
  const COL_G = [124, 255, 122];
  const COL_C = [100, 215, 255];
  const COL_Y = [255, 212, 104];

  const bg = "#000000";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  // ---- Helpers ----
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  // seeded RNG (stable look per refresh)
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // ---- Choose a chunky “cell” size (key to the ANSI mosaic look) ----
  const cell = clamp(Math.round(cssW / 160), 6, 10); // 6–10px looks right
  const cols = Math.floor(cssW / cell);
  const rows = Math.floor(cssH / cell);

  // ---- Text rendering to an offscreen mask ----
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d");

  octx.clearRect(0, 0, cols, rows);
  octx.fillStyle = "#000";
  octx.fillRect(0, 0, cols, rows);

  // Render big text into the low-res grid
  octx.fillStyle = "#fff";
  octx.textBaseline = "middle";
  octx.textAlign = "left";

  // Font size in "cell units"
  const fontPx = Math.floor(rows * 0.58);
  octx.font = `900 ${fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`;

  // Position and word spacing similar to your image
  const text = "HUMAN IN BETA";
  const x0 = Math.floor(cols * 0.06);
  const y0 = Math.floor(rows * 0.42);

  // Slight “blocky” feel: draw twice with tiny offset
  octx.fillText(text, x0, y0);
  octx.globalAlpha = 0.35;
  octx.fillText(text, x0 + 1, y0);
  octx.globalAlpha = 1;

  // Read the mask pixels
  const mask = octx.getImageData(0, 0, cols, rows).data;

  // ---- Draw mosaic cells inside text with noise, shatter, and color bias ----
  // Word-based color bias: HUMAN green-heavy, IN cyan, BETA yellow-heavy
  // We'll infer horizontal position and apply ramp segments.
  const wordRamp = (t) => {
    // t: 0..1 across logo width
    // left = more green, center = cyan, right = yellow
    if (t < 0.52) return mix3(COL_G, COL_C, t / 0.52);
    return mix3(COL_C, COL_Y, (t - 0.52) / 0.48);
  };

  // Shatter mask: bite more at left/right edges and random missing tiles
  const edgeBite = (tx) => {
    // stronger at left/right extremes
    const dL = tx;
    const dR = 1 - tx;
    const e = Math.min(dL, dR);
    // map: center ~0, edges ~1
    return clamp(1 - e * 3.2, 0, 1);
  };

  // Draw inside-glyph tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 4;
      const on = mask[idx] > 40; // in text

      if (!on) continue;

      const tx = c / (cols - 1);
      let col = wordRamp(tx);

      // per-cell brightness noise (gives that mosaic texture)
      const n = (rand() - 0.5) * 0.28; // +/- 14%
      const bright = 1 + n;

      // “speckle” / imperfect cells
      const speck = rand();
      const speckMul = speck < 0.08 ? 0.65 : (speck > 0.94 ? 1.25 : 1.0);

      // random “holes” (shatter), stronger near edges
      const bite = edgeBite(tx);
      const holeChance = 0.03 + bite * 0.10;
      if (rand() < holeChance) continue;

      // slight internal erosion near top/bottom to feel worn
      const v = r / (rows - 1);
      if (rand() < 0.01 + Math.abs(v - 0.5) * 0.015) continue;

      const rr = Math.round(col[0] * bright * speckMul);
      const gg = Math.round(col[1] * bright * speckMul);
      const bb = Math.round(col[2] * bright * speckMul);

      // draw tile
      ctx.fillStyle = `rgb(${clamp(rr,0,255)},${clamp(gg,0,255)},${clamp(bb,0,255)})`;
      ctx.fillRect(c * cell, r * cell, cell, cell);

      // tiny sub-cell “glyph texture” (looks like small characters inside tiles)
      if (rand() < 0.55) {
        ctx.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.10})`;
        const px = c * cell + Math.floor(rand() * (cell - 2));
        const py = r * cell + Math.floor(rand() * (cell - 2));
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  // ---- Horizontal glitch streaks (outside the glyphs) ----
  // We draw broken segments on several rows that overlap the logo region.
  const streakTop = Math.floor(rows * 0.12);
  const streakBot = Math.floor(rows * 0.62);

  for (let r = streakTop; r < streakBot; r++) {
    if (rand() < 0.42) continue; // not every row

    const y = r * cell + Math.floor(cell * 0.25);
    let x = -Math.floor(cssW * 0.06);
    const end = cssW + Math.floor(cssW * 0.06);

    while (x < end) {
      // gaps / segments
      const gap = Math.floor(lerp(10, 80, rand()));
      const seg = Math.floor(lerp(24, 170, rand()));
      x += gap;
      const segStart = x;
      const segEnd = Math.min(end, x + seg);

      // choose color based on horizontal position but with random bias
      const tx = clamp(segStart / cssW, 0, 1);
      let base = wordRamp(tx);
      if (rand() < 0.25) base = mix3(base, [255,255,255], 0.12);

      const alpha = 0.10 + rand() * 0.22;
      ctx.fillStyle = `rgba(${base[0]|0},${base[1]|0},${base[2]|0},${alpha})`;

      // varying thickness (1–2 cells)
      const h = (rand() < 0.7) ? Math.max(1, Math.floor(cell * 0.20)) : Math.max(1, Math.floor(cell * 0.35));
      ctx.fillRect(segStart, y, segEnd - segStart, h);

      // sometimes add a second line just below (banding)
      if (rand() < 0.28) {
        ctx.fillStyle = `rgba(${base[0]|0},${base[1]|0},${base[2]|0},${alpha * 0.7})`;
        ctx.fillRect(segStart, y + h + 1, segEnd - segStart, Math.max(1, Math.floor(h * 0.8)));
      }

      x = segEnd;
    }
  }

  // ---- Drips (vertical runs) ----
  // Sparse columns under the logo, mostly near left and right cluster areas.
  const dripCount = 6 + Math.floor(rand() * 6);
  for (let i = 0; i < dripCount; i++) {
    const sideBias = rand() < 0.5 ? rand() * 0.22 : 1 - rand() * 0.22;
    const xCell = Math.floor(sideBias * (cols - 1));
    const yStart = Math.floor(rows * (0.46 + rand() * 0.18));
    const len = Math.floor(rows * (0.10 + rand() * 0.22));

    const base = wordRamp(xCell / (cols - 1));
    ctx.fillStyle = `rgba(${base[0]|0},${base[1]|0},${base[2]|0},${0.18 + rand() * 0.25})`;

    for (let k = 0; k < len; k++) {
      // small breaks
      if (rand() < 0.18) continue;
      const rr = yStart + k;
      if (rr >= rows) break;
      ctx.fillRect(xCell * cell + Math.floor(cell * 0.35), rr * cell, Math.max(1, Math.floor(cell * 0.18)), cell);
    }
  }

  // ---- CRT-ish fine noise over the logo area ----
  // Adds that “phosphor grain” without turning into a blur.
  const noiseAlpha = 0.06;
  for (let i = 0; i < Math.floor((cssW * cssH) / 2200); i++) {
    const x = Math.floor(rand() * cssW);
    const y = Math.floor(rand() * cssH);
    ctx.fillStyle = `rgba(255,255,255,${noiseAlpha * rand()})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

// Call once at load and on resize.
// If you pasted this into app.js, call renderLogo() before boot().
window.addEventListener("resize", () => renderLogo());
document.addEventListener("DOMContentLoaded", () => renderLogo());
