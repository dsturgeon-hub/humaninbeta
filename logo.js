// logo.js — higher-fidelity ANSI-mosaic logo renderer
// Key changes vs your current version:
// 1) Text mask rendered at pixel resolution (NOT tile resolution) => better letter shapes
// 2) Smaller tiles (3–6px) => more like reference mosaic
// 3) Hard word segmentation (HUMAN green, IN cyan, BETA yellow) with tiny bleed
// 4) Dense streak bands across the logo band
// 5) Drips biased to originate from filled strokes

function renderLogo() {
  const canvas = document.getElementById("logo");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // CSS size
  const cssW = Math.min(canvas.parentElement.clientWidth, 980);
  const cssH = Math.round(cssW * (220 / 1200));
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Palette (same as before)
  const COL_G = [124, 255, 122];
  const COL_C = [100, 215, 255];
  const COL_Y = [255, 212, 104];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];

  // Stable RNG
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const randi = (a, b) => Math.floor(lerp(a, b + 1, rand()));

  // Clear
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cssW, cssH);

  // ---- Tile size: smaller = closer to reference mosaic ----
  // Your screenshot looks ~4–5px “cells” at this logo width.
  const tile = clamp(Math.round(cssW / 240), 3, 6); // 3–6px
  const cols = Math.floor(cssW / tile);
  const rows = Math.floor(cssH / tile);

  // ---- Offscreen mask at PIXEL resolution (critical) ----
  const off = document.createElement("canvas");
  off.width = cssW;
  off.height = cssH;
  const octx = off.getContext("2d");

  octx.clearRect(0, 0, cssW, cssH);
  octx.fillStyle = "#000";
  octx.fillRect(0, 0, cssW, cssH);

  const text = "HUMAN IN BETA";

  // Use a wider, blockier face if available; fall back safely.
  // (This improves the letterforms vs monospace-only.)
  const fontPx = Math.floor(cssH * 0.62);
  octx.font = `900 ${fontPx}px "Arial Black", Impact, Haettenschweiler, ui-sans-serif, system-ui`;
  octx.textBaseline = "middle";
  octx.textAlign = "left";

  const x0px = Math.floor(cssW * 0.055);
  const y0px = Math.floor(cssH * 0.38);

  // Slight double draw for stronger strokes (like the reference)
  octx.fillStyle = "#fff";
  octx.fillText(text, x0px, y0px);
  octx.globalAlpha = 0.30;
  octx.fillText(text, x0px + 2, y0px);
  octx.globalAlpha = 1;

  const mask = octx.getImageData(0, 0, cssW, cssH).data;

  // ---- Hard word segmentation boundaries (measured in pixels) ----
  const wHuman = octx.measureText("HUMAN").width;
  const wSpace = octx.measureText(" ").width;
  const wIn = octx.measureText("IN").width;

  const xHuman0 = x0px;
  const xHuman1 = x0px + wHuman;
  const xIn0 = xHuman1 + wSpace;
  const xIn1 = xIn0 + wIn;
  const xBeta0 = xIn1 + wSpace;

  const bleedPx = tile * 1.5; // tiny seam blend

  const baseColorAtX = (x) => {
    if (x < xHuman1 - bleedPx) return COL_G;
    if (x < xHuman1 + bleedPx) return mix(COL_G, COL_C, (x - (xHuman1 - bleedPx)) / (bleedPx * 2));

    if (x < xIn1 - bleedPx) return COL_C;
    if (x < xIn1 + bleedPx) return mix(COL_C, COL_Y, (x - (xIn1 - bleedPx)) / (bleedPx * 2));

    return COL_Y;
  };

  // Edge emphasis (more shatter + more streak energy at ends)
  const edgeWeight = (xNorm) => {
    const left = Math.max(0, 0.32 - xNorm) / 0.32;
    const right = Math.max(0, xNorm - 0.68) / 0.32;
    return clamp(left + right, 0, 1);
  };

  // ---- Draw mosaic tiles by sampling the pixel mask ----
  // We sample the center of each tile; you can do multi-sample if you want even smoother.
  const holes = new Set();

  // Precompute clustered holes (chunky breakups) but NOT too aggressive (reference keeps readability)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile + (tile >> 1);
      const y = r * tile + (tile >> 1);
      const idx = (y * cssW + x) * 4;
      const on = mask[idx] > 40;
      if (!on) continue;

      const xNorm = x / cssW;
      const ew = edgeWeight(xNorm);
      const v = y / cssH;

      // subtle hole chance; more at edges + slightly more lower half
      const base = 0.012 + ew * 0.055 + Math.max(0, v - 0.55) * 0.03;

      // clustered holes sometimes (2x2)
      if (rand() < base * 0.35) {
        for (let rr = 0; rr < 2; rr++) {
          for (let cc = 0; cc < 2; cc++) {
            holes.add(`${c + cc},${r + rr}`);
          }
        }
      } else if (rand() < base * 0.22) {
        holes.add(`${c},${r}`);
      }
    }
  }

  // Tile draw
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile + (tile >> 1);
      const y = r * tile + (tile >> 1);
      if (x >= cssW || y >= cssH) continue;

      const idx = (y * cssW + x) * 4;
      const on = mask[idx] > 40;
      if (!on) continue;
      if (holes.has(`${c},${r}`)) continue;

      const base = baseColorAtX(x);

      // brightness variance like reference
      const n = (rand() - 0.5) * 0.34; // +/- 17%
      const bright = 1 + n;

      // speckle: occasional dim/hot tiles
      const s = rand();
      const speckMul = s < 0.10 ? 0.70 : (s > 0.95 ? 1.30 : 1.0);

      let rr = clamp(Math.round(base[0] * bright * speckMul), 0, 255);
      let gg = clamp(Math.round(base[1] * bright * speckMul), 0, 255);
      let bb = clamp(Math.round(base[2] * bright * speckMul), 0, 255);

      ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
      ctx.fillRect(c * tile, r * tile, tile, tile);

      // Micro “glyph texture” inside tiles (this is what your current look lacks)
      // draw 1–3 small sub-rects inside the tile, like tiny characters.
      const micro = rand();
      if (micro < 0.78) {
        const count = micro < 0.30 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const mx = c * tile + randi(0, Math.max(0, tile - 2));
          const my = r * tile + randi(0, Math.max(0, tile - 2));
          ctx.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.12})`;
          ctx.fillRect(mx, my, 1, 1);
          // sometimes a second pixel to look like “glyph”
          if (rand() < 0.35) ctx.fillRect(mx + 1, my, 1, 1);
        }
      }
    }
  }

  // ---- Dense horizontal streak field (matches reference better) ----
  // Instead of sparse lines, we lay down many broken bands across the logo area.
  const bandTop = Math.floor(cssH * 0.08);
  const bandBot = Math.floor(cssH * 0.56);

  for (let y = bandTop; y < bandBot; y += 2) {
    if (rand() < 0.22) continue; // leave gaps

    const yNorm = y / cssH;
    const thickness = rand() < 0.60 ? 1 : 2;

    // multiple segments per row
    const segs = 5 + randi(0, 7);

    for (let s = 0; s < segs; s++) {
      // bias segments to edges more often
      const p = rand();
      let xStart;
      if (p < 0.42) xStart = -Math.floor(cssW * 0.08) + Math.floor(rand() * cssW * 0.42);
      else if (p < 0.84) xStart = Math.floor(cssW * 0.58 + rand() * cssW * 0.50);
      else xStart = Math.floor(cssW * 0.30 + rand() * cssW * 0.40);

      const len = Math.floor(lerp(120, 520, rand()));
      const xEnd = xStart + len;

      const xMid = clamp(xStart + len * 0.5, 0, cssW - 1);
      let col = baseColorAtX(xMid);

      // brighten a little on some streaks like phosphor overdrive
      if (rand() < 0.18) col = mix(col, [255,255,255], 0.14);

      // alpha depends on row area; stronger mid-top
      const a = (0.08 + rand() * 0.18) * (1.10 - Math.abs(yNorm - 0.30));
      ctx.fillStyle = `rgba(${col[0]|0},${col[1]|0},${col[2]|0},${clamp(a,0.04,0.22)})`;

      ctx.fillRect(xStart, y, len, thickness);

      // secondary ghost band beneath (reference has a lot of this)
      if (rand() < 0.40) {
        ctx.fillStyle = `rgba(${col[0]|0},${col[1]|0},${col[2]|0},${clamp(a * 0.55,0.02,0.14)})`;
        ctx.fillRect(xStart + randi(-10, 10), y + thickness + 1, len - randi(0, 60), 1);
      }
    }
  }

  // ---- Drips (biased to originate from strokes) ----
  // Choose drip columns where the mask is ON near the bottom of the letters.
  const dripCandidates = [];
  const dripYProbe = Math.floor(cssH * 0.48);

  for (let i = 0; i < 180; i++) {
    const x = randi(Math.floor(cssW * 0.05), Math.floor(cssW * 0.95));
    const idx = (dripYProbe * cssW + x) * 4;
    if (mask[idx] > 40) dripCandidates.push(x);
  }

  const dripCount = clamp(10 + randi(0, 8), 10, 18);
  for (let i = 0; i < dripCount; i++) {
    const x = dripCandidates.length ? dripCandidates[randi(0, dripCandidates.length - 1)] : randi(0, cssW - 1);

    const yStart = Math.floor(cssH * (0.44 + rand() * 0.20));
    const len = Math.floor(cssH * (0.12 + rand() * 0.26));

    let col = baseColorAtX(x);
    const a = 0.14 + rand() * 0.24;

    // 2–4px width like reference drips
    const w = clamp(randi(2, 4), 2, 5);

    for (let k = 0; k < len; k++) {
      if (rand() < 0.16) continue; // breaks
      const yy = yStart + k;
      if (yy >= cssH) break;
      ctx.fillStyle = `rgba(${col[0]|0},${col[1]|0},${col[2]|0},${a})`;
      ctx.fillRect(x, yy, w, 1);
    }
  }

  // ---- Fine grain (subtle) ----
  const pts = Math.floor((cssW * cssH) / 2600);
  for (let i = 0; i < pts; i++) {
    const x = Math.floor(rand() * cssW);
    const y = Math.floor(rand() * cssH);
    ctx.fillStyle = `rgba(255,255,255,${0.018 + rand() * 0.05})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

window.addEventListener("resize", () => renderLogo());
document.addEventListener("DOMContentLoaded", () => renderLogo());
