// logo.js — procedural ANSI-mosaic logo renderer (reference-matching)
// - hard word color segmentation (HUMAN green, IN cyan, BETA yellow)
// - rectangular-ish cells (cellW != cellH)
// - clustered shatter holes (2x2 bites), stronger on left/right
// - streaks biased to left/right thirds and thicker/bandier
// - thicker drips (2–3 cell wide)
// - stable seeded noise

function renderLogo() {
  const canvas = document.getElementById("logo");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Match canvas resolution to CSS size (sharp, but still pixelated by CSS)
  const cssW = Math.min(canvas.parentElement.clientWidth, 980);
  const cssH = Math.round(cssW * (220 / 1200));
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Palette (tuned to your reference)
  const COL_G = [124, 255, 122];
  const COL_C = [100, 215, 255];
  const COL_Y = [255, 212, 104];

  // Helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];

  // Stable seeded RNG (same look every load unless you change the seed)
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const randi = (a, b) => Math.floor(lerp(a, b + 1, rand()));

  // Clear background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cssW, cssH);

  // ---- Cell geometry (rectangular-ish, like the reference) ----
  // Square tiles read too clean; the reference looks slightly non-square due to sampling/scanline interaction.
  const base = clamp(Math.round(cssW / 160), 6, 10);      // 6–10
  const cellW = base + (base >= 8 ? 1 : 0);              // slight widen
  const cellH = Math.max(5, base - (base >= 9 ? 2 : 1)); // slightly shorter

  const cols = Math.floor(cssW / cellW);
  const rows = Math.floor(cssH / cellH);

  // ---- Offscreen mask at cell resolution ----
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d");

  octx.fillStyle = "#000";
  octx.fillRect(0, 0, cols, rows);

  const text = "HUMAN IN BETA";
  octx.fillStyle = "#fff";
  octx.textBaseline = "middle";
  octx.textAlign = "left";

  // Font sizing in cell-grid pixels
  const fontPx = Math.floor(rows * 0.62);
  octx.font = `900 ${fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`;

  const x0 = Math.floor(cols * 0.05);
  const y0 = Math.floor(rows * 0.42);

  // Slight double-draw to thicken edges
  octx.fillText(text, x0, y0);
  octx.globalAlpha = 0.33;
  octx.fillText(text, x0 + 1, y0);
  octx.globalAlpha = 1;

  const mask = octx.getImageData(0, 0, cols, rows).data;

  // ---- Compute hard word boundaries (in cell coords) ----
  // We measure the same font in the same offscreen context so segmentation is stable.
  const wHuman = octx.measureText("HUMAN").width;
  const wSpace = octx.measureText(" ").width;
  const wIn = octx.measureText("IN").width;

  const xHuman0 = x0;
  const xHuman1 = Math.floor(x0 + wHuman);

  const xIn0 = Math.floor(x0 + wHuman + wSpace);
  const xIn1 = Math.floor(xIn0 + wIn);

  const xBeta0 = Math.floor(xIn1 + wSpace);
  const xBeta1 = cols; // rest

  // Hard-segmented color selection with a small bleed band on the edges
  const colorForCell = (cx) => {
    const bleed = 2; // 2 cells of bleed for a slight mixing seam
    if (cx <= xHuman1 - bleed) return COL_G;
    if (cx < xHuman1 + bleed)  return mix(COL_G, COL_C, (cx - (xHuman1 - bleed)) / (bleed * 2));

    if (cx <= xIn1 - bleed) return COL_C;
    if (cx < xIn1 + bleed)  return mix(COL_C, COL_Y, (cx - (xIn1 - bleed)) / (bleed * 2));

    return COL_Y;
  };

  // Edge weighting: more shatter and streak energy on left/right thirds like the reference
  const edgeWeight = (tx) => {
    // tx 0..1
    const left = Math.max(0, 0.33 - tx) / 0.33;
    const right = Math.max(0, tx - 0.66) / 0.34;
    return clamp(left + right, 0, 1); // 0 center, 1 edges
  };

  // Clustered “bite” by occasionally removing a 2x2 block instead of one cell
  const maybeClusterHole = (c, r, chance) => {
    if (rand() >= chance) return false;
    // remove this and a neighbor (2x2) for chunky shatter
    const cc = c + (rand() < 0.5 ? 0 : 1);
    const rr = r + (rand() < 0.5 ? 0 : 1);
    // mark 2x2 by drawing nothing at those coords: handled by skipping draw via a lookup
    holeMap.add(`${c},${r}`);
    holeMap.add(`${cc},${r}`);
    holeMap.add(`${c},${rr}`);
    holeMap.add(`${cc},${rr}`);
    return true;
  };

  // A map of holes to skip (allows clustered removal)
  const holeMap = new Set();

  // Pre-pass: decide holes so clusters can form
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 4;
      const on = mask[idx] > 40;
      if (!on) continue;

      const tx = c / (cols - 1);
      const ew = edgeWeight(tx);

      // Base hole chance + stronger at edges + a bit stronger on lower half (reference looks more broken there)
      const v = r / (rows - 1);
      const base = 0.018 + ew * 0.11 + Math.max(0, v - 0.55) * 0.05;

      // Cluster holes sometimes
      if (maybeClusterHole(c, r, base * 0.40)) continue;

      // Single cell hole sometimes
      if (rand() < base * 0.35) holeMap.add(`${c},${r}`);
    }
  }

  // ---- Draw mosaic cells inside glyphs ----
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 4;
      const on = mask[idx] > 40;
      if (!on) continue;

      if (holeMap.has(`${c},${r}`)) continue;

      const baseCol = colorForCell(c);

      // brightness variance per tile (reference has noticeable variation)
      const n = (rand() - 0.5) * 0.38;              // +/- 19%
      const bright = 1 + n;

      // speckle: some tiles duller, some hotter
      const speck = rand();
      const speckMul = speck < 0.10 ? 0.62 : (speck > 0.94 ? 1.32 : 1.0);

      let rr = Math.round(baseCol[0] * bright * speckMul);
      let gg = Math.round(baseCol[1] * bright * speckMul);
      let bb = Math.round(baseCol[2] * bright * speckMul);

      rr = clamp(rr, 0, 255);
      gg = clamp(gg, 0, 255);
      bb = clamp(bb, 0, 255);

      ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
      ctx.fillRect(c * cellW, r * cellH, cellW, cellH);

      // internal “glyph texture” points (more structured, not uniform)
      // Use 1–3 points per tile with slightly higher probability like the reference mosaic.
      const dots = rand() < 0.55 ? 1 : (rand() < 0.25 ? 2 : 0);
      for (let k = 0; k < dots; k++) {
        ctx.fillStyle = `rgba(255,255,255,${0.06 + rand() * 0.12})`;
        const px = c * cellW + randi(1, Math.max(1, cellW - 2));
        const py = r * cellH + randi(1, Math.max(1, cellH - 2));
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  // ---- Horizontal streaks (outside + over the glyphs), biased to left/right thirds ----
  const streakTop = Math.floor(rows * 0.10);
  const streakBot = Math.floor(rows * 0.64);

  for (let r = streakTop; r < streakBot; r++) {
    // streak rows appear often, but with randomness
    if (rand() < 0.30) continue;

    const y = r * cellH + Math.floor(cellH * 0.25);

    // decide how many segments this row will have
    const segments = 3 + randi(0, 5);

    for (let s = 0; s < segments; s++) {
      // pick start region with bias to edges
      const p = rand();
      let xStart;
      if (p < 0.42) xStart = -Math.floor(cssW * 0.06) + Math.floor(rand() * cssW * 0.40);       // left-heavy
      else if (p < 0.84) xStart = Math.floor(cssW * 0.60 + rand() * cssW * 0.46);               // right-heavy
      else xStart = Math.floor(cssW * 0.30 + rand() * cssW * 0.40);                              // occasional center

      const segLen = Math.floor(lerp(120, 420, rand())); // longer than before
      const xEnd = xStart + segLen;

      // choose base color from the word segmentation based on cell coordinate
      const cx = Math.floor((xStart / cssW) * cols);
      let baseCol = colorForCell(clamp(cx, 0, cols - 1));

      // occasional whitening like overbright phosphor
      if (rand() < 0.18) baseCol = mix(baseCol, [255, 255, 255], 0.14);

      const alpha = 0.10 + rand() * 0.26;
      ctx.fillStyle = `rgba(${baseCol[0]|0},${baseCol[1]|0},${baseCol[2]|0},${alpha})`;

      // thickness: 1–2 cellH, plus occasional extra band like the reference
      const h1 = Math.max(1, Math.floor(cellH * (rand() < 0.55 ? 0.35 : 0.55)));
      ctx.fillRect(xStart, y, segLen, h1);

      if (rand() < 0.42) {
        ctx.fillStyle = `rgba(${baseCol[0]|0},${baseCol[1]|0},${baseCol[2]|0},${alpha * 0.70})`;
        const h2 = Math.max(1, Math.floor(h1 * 0.9));
        ctx.fillRect(xStart + randi(-8, 8), y + h1 + 1, segLen - randi(0, 20), h2);
      }
    }
  }

  // ---- Drips (thicker and more “runny”) ----
  const dripCount = 10 + randi(0, 6);
  for (let i = 0; i < dripCount; i++) {
    // strong bias to edges like the reference
    const sideBias = rand() < 0.5 ? rand() * 0.22 : 1 - rand() * 0.22;
    const c0 = Math.floor(sideBias * (cols - 1));

    const yStart = Math.floor(rows * (0.44 + rand() * 0.22));
    const len = Math.floor(rows * (0.14 + rand() * 0.26));

    const baseCol = colorForCell(c0);
    const alpha = 0.18 + rand() * 0.28;

    // thickness 2–3 cells wide
    const wCells = rand() < 0.65 ? 2 : 3;

    for (let k = 0; k < len; k++) {
      if (rand() < 0.14) continue; // breaks
      const rr = yStart + k;
      if (rr >= rows) break;

      ctx.fillStyle = `rgba(${baseCol[0]|0},${baseCol[1]|0},${baseCol[2]|0},${alpha})`;

      const px = c0 * cellW + Math.floor(cellW * 0.25);
      const py = rr * cellH;
      ctx.fillRect(px, py, Math.max(1, Math.floor(cellW * (0.18 * wCells))), cellH);
    }
  }

  // ---- Fine grain (keep subtle; CRT scanlines handled by CSS) ----
  const noisePts = Math.floor((cssW * cssH) / 2400);
  for (let i = 0; i < noisePts; i++) {
    const x = Math.floor(rand() * cssW);
    const y = Math.floor(rand() * cssH);
    ctx.fillStyle = `rgba(255,255,255,${0.025 + rand() * 0.05})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

// Render on load + resize
window.addEventListener("resize", () => renderLogo());
document.addEventListener("DOMContentLoaded", () => renderLogo());
