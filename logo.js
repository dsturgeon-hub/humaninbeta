// logo.js — responsive ANSI-mosaic logo (no cutoff, scales correctly)
// Exposes window.renderLogo so app.js can trigger it.

(function () {
  const COL_G = [124, 255, 122];
  const COL_C = [100, 215, 255];
  const COL_Y = [255, 212, 104];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];

  function makeRng(seed0) {
    let seed = seed0 >>> 0;
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function renderLogo() {
    const canvas = document.getElementById("logo");
    if (!canvas) return;

    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");

    const cssW = Math.max(320, Math.floor(parent.clientWidth));
    const cssH = Math.max(90, Math.floor(cssW * (220 / 1200)));
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cssW, cssH);

    // stable per-size seed (so it doesn't change every minor resize)
    const seed = (cssW * 73856093) ^ (cssH * 19349663) ^ 1337;
    const rand = makeRng(seed);
    const randi = (a, b) => Math.floor(lerp(a, b + 1, rand()));

    // mosaic tile size tuned for readability + “ANSI cell” look
    const tile = clamp(Math.round(cssW / 320), 3, 5);
    const cols = Math.floor(cssW / tile);
    const rows = Math.floor(cssH / tile);

    // offscreen pixel mask (pixel resolution — keeps letter edges crisp)
    const off = document.createElement("canvas");
    off.width = cssW;
    off.height = cssH;
    const octx = off.getContext("2d");

    octx.fillStyle = "#000";
    octx.fillRect(0, 0, cssW, cssH);

    const text = "HUMAN IN BETA";
    const fontStack = `"Arial Black", Impact, Haettenschweiler, ui-sans-serif, system-ui`;

    // ---- Fit-to-width (SAFE AREA) to prevent right-edge cutoff ----
    const safePad = Math.max(28, Math.floor(cssW * 0.08));
    const maxTextW = cssW - safePad * 2;
    const maxTextH = Math.floor(cssH * 0.62);
    const yMid = Math.floor(cssH * 0.34);

    let fontPx = Math.floor(cssH * 0.70);
    octx.font = `900 ${fontPx}px ${fontStack}`;

    let measured = octx.measureText(text).width;

    if (measured > 0) {
      const scaleW = maxTextW / measured;
      const scaleH = maxTextH / fontPx;
      const scale = Math.min(scaleW * 0.98, scaleH, 1); // slack for double-draw
      fontPx = Math.floor(fontPx * scale);
    }

    octx.font = `900 ${fontPx}px ${fontStack}`;
    measured = octx.measureText(text).width;

    let x0 = Math.floor((cssW - measured) / 2);
    x0 = Math.max(safePad, Math.min(x0, cssW - safePad - measured - 3));

    const y0 = yMid;

    // band region used later
    const bandTop = Math.floor(cssH * 0.08);
    const bandBot = Math.floor(cssH * 0.56);

    // text paint to mask
    octx.fillStyle = "#fff";
    octx.textBaseline = "middle";
    octx.textAlign = "left";
    octx.fillText(text, x0, y0);
    octx.globalAlpha = 0.30;
    octx.fillText(text, x0 + 1, y0);
    octx.globalAlpha = 1;

    const mask = octx.getImageData(0, 0, cssW, cssH).data;

    // Word segmentation boundaries (pixels)
    const wHuman = octx.measureText("HUMAN").width;
    const wSpace = octx.measureText(" ").width;
    const wIn = octx.measureText("IN").width;

    const xHuman1 = x0 + wHuman;
    const xIn0 = xHuman1 + wSpace;
    const xIn1 = xIn0 + wIn;

    const bleedPx = Math.max(4, Math.floor(fontPx * 0.02));

    function baseColorAtX(px) {
      if (px < xHuman1 - bleedPx) return COL_G;
      if (px < xHuman1 + bleedPx) return mix(COL_G, COL_C, (px - (xHuman1 - bleedPx)) / (bleedPx * 2));

      if (px < xIn1 - bleedPx) return COL_C;
      if (px < xIn1 + bleedPx) return mix(COL_C, COL_Y, (px - (xIn1 - bleedPx)) / (bleedPx * 2));

      return COL_Y;
    }

    function edgeWeight(px) {
      const t = px / cssW; // 0..1
      const left = Math.max(0, 0.33 - t) / 0.33;
      const right = Math.max(0, t - 0.67) / 0.33;
      return clamp(left + right, 0, 1);
    }

    // Precompute subtle holes (keep readability; no minecraft)
    const holes = new Set();
    for (let r = 0; r < rows; r++) {
      const y = r * tile + (tile >> 1);
      for (let c = 0; c < cols; c++) {
        const x = c * tile + (tile >> 1);
        if (x >= cssW || y >= cssH) continue;

        const idx = (y * cssW + x) * 4;
        if (mask[idx] <= 40) continue;

        const ew = edgeWeight(x);
        const v = y / cssH;

        const base = 0.010 + ew * 0.06 + Math.max(0, v - 0.55) * 0.03;

        if (rand() < base * 0.28) {
          for (let rr = 0; rr < 2; rr++) for (let cc = 0; cc < 2; cc++) holes.add(`${c + cc},${r + rr}`);
        } else if (rand() < base * 0.18) {
          holes.add(`${c},${r}`);
        }
      }
    }

    // Draw mosaic tiles (sample mask at tile centers)
    for (let r = 0; r < rows; r++) {
      const y = r * tile + (tile >> 1);
      for (let c = 0; c < cols; c++) {
        const x = c * tile + (tile >> 1);
        if (x >= cssW || y >= cssH) continue;

        const idx = (y * cssW + x) * 4;
        if (mask[idx] <= 40) continue;
        if (holes.has(`${c},${r}`)) continue;

        const base = baseColorAtX(x);

        const n = (rand() - 0.5) * 0.40;
        const bright = 1 + n;
        const s = rand();
        const speckMul = s < 0.10 ? 0.75 : (s > 0.95 ? 1.28 : 1.0);

        const rr = clamp(Math.round(base[0] * bright * speckMul), 0, 255);
        const gg = clamp(Math.round(base[1] * bright * speckMul), 0, 255);
        const bb = clamp(Math.round(base[2] * bright * speckMul), 0, 255);

        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(c * tile, r * tile, tile, tile);

        // micro “glyph” texture
        if (rand() < 0.78) {
          const count = rand() < 0.35 ? 2 : 1;
          for (let k = 0; k < count; k++) {
            const mx = c * tile + randi(0, Math.max(0, tile - 2));
            const my = r * tile + randi(0, Math.max(0, tile - 2));
            ctx.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.12})`;
            ctx.fillRect(mx, my, 1, 1);
            if (rand() < 0.35) ctx.fillRect(mx + 1, my, 1, 1);
          }
        }
      }
    }

    // Dense streak bands (across top half of logo area)
    for (let y = bandTop; y < bandBot; y += 2) {
      if (rand() < 0.14) continue;

      const segs = 7 + randi(0, 10);
      const thickness = rand() < 0.55 ? 1 : 2;

      for (let s = 0; s < segs; s++) {
        const p = rand();
        let xStart;
        if (p < 0.44) xStart = -Math.floor(cssW * 0.08) + Math.floor(rand() * cssW * 0.44);
        else if (p < 0.88) xStart = Math.floor(cssW * 0.56 + rand() * cssW * 0.52);
        else xStart = Math.floor(cssW * 0.30 + rand() * cssW * 0.40);

        const len = Math.floor(lerp(140, 560, rand()));
        const xMid = clamp(xStart + len * 0.5, 0, cssW - 1);

        let col = baseColorAtX(xMid);
        if (rand() < 0.18) col = mix(col, [255, 255, 255], 0.14);

        const a = clamp((0.08 + rand() * 0.18) * (1.1 - Math.abs((y / cssH) - 0.30)), 0.05, 0.22);
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
        ctx.fillRect(xStart, y, len, thickness);

        if (rand() < 0.42) {
          ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a * 0.55})`;
          ctx.fillRect(xStart + randi(-10, 10), y + thickness + 1, len - randi(0, 80), 1);
        }
      }
    }

    // Drips biased to originate from strokes (probe under letter band)
    const candidates = [];
    const probeY = Math.floor(cssH * 0.48);
    for (let i = 0; i < 220; i++) {
      const x = randi(Math.floor(cssW * 0.06), Math.floor(cssW * 0.94));
      const idx = (probeY * cssW + x) * 4;
      if (mask[idx] > 40) candidates.push(x);
    }

    const dripCount = clamp(10 + randi(0, 8), 10, 18);
    for (let i = 0; i < dripCount; i++) {
      const x = candidates.length ? candidates[randi(0, candidates.length - 1)] : randi(0, cssW - 1);
      const yStart = Math.floor(cssH * (0.44 + rand() * 0.22));
      const len = Math.floor(cssH * (0.18 + rand() * 0.32));
      const w = clamp(randi(2, 4), 2, 5);

      const col = baseColorAtX(x);
      const a = 0.14 + rand() * 0.24;

      for (let k = 0; k < len; k++) {
        if (rand() < 0.16) continue;
        const yy = yStart + k;
        if (yy >= cssH) break;
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
        ctx.fillRect(x, yy, w, 1);
      }
    }

    // Fine grain
    const pts = Math.floor((cssW * cssH) / 2600);
    for (let i = 0; i < pts; i++) {
      const x = Math.floor(rand() * cssW);
      const y = Math.floor(rand() * cssH);
      ctx.fillStyle = `rgba(255,255,255,${0.018 + rand() * 0.05})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  window.renderLogo = renderLogo;
  window.addEventListener("resize", () => renderLogo());
  document.addEventListener("DOMContentLoaded", () => renderLogo());
})();
