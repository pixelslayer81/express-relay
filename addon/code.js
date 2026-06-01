/**
 * Microsoft Social Templates — Adobe Express Add-On
 * Document Sandbox (code.js)
 *
 * Creates template layers natively in the Express document using the
 * Document API, so all text and shapes are fully editable.
 */

import AddOnSdk from "add-on-sdk-document-sandbox";
import { editor, colorUtils } from "express-document-sdk";

// ─── Expose API to panel (index.html) ────────────────────────────────────────
AddOnSdk.instance.runtime.exposeApi({
  createTemplate
});

// ─── Color palettes ──────────────────────────────────────────────────────────
const PALETTE = {
  light: {
    bg:      { r: 1,      g: 1,      b: 1      }, // #ffffff
    surface: { r: 0.965,  g: 0.965,  b: 0.965  }, // #f6f6f6
    accent:  { r: 0.710,  g: 0.216,  b: 0.604  }, // #b5379a
    text:    { r: 0.039,  g: 0.039,  b: 0.039  }, // #0a0a0a
    subtext: { r: 0.333,  g: 0.333,  b: 0.345  }  // #555558
  },
  dark: {
    bg:      { r: 0.039,  g: 0.039,  b: 0.039  }, // #0a0a0a
    surface: { r: 0.102,  g: 0.102,  b: 0.110  }, // #1a1a1c
    accent:  { r: 0.710,  g: 0.216,  b: 0.604  }, // #b5379a
    text:    { r: 1,      g: 1,      b: 1      }, // #ffffff
    subtext: { r: 0.659,  g: 0.659,  b: 0.667  }  // #a8a8aa
  }
};

// ─── Canvas dimensions ───────────────────────────────────────────────────────
const DIMS = {
  "1:1":  { w: 1080, h: 1080 },
  "4:5":  { w: 1080, h: 1350 },
  "16:9": { w: 1920, h: 1080 }
};

// ─── Utility: rgb obj (0–1) → Express color ──────────────────────────────────
function rgb(c) {
  return colorUtils.fromRGB(c.r, c.g, c.b);
}

// ─── Core: build the template in Express ─────────────────────────────────────
async function createTemplate({ type, format, mode, headline, body }) {
  const pal  = PALETTE[mode] || PALETTE.light;
  const dims = DIMS[format]  || DIMS["1:1"];

  const page = editor.documentRoot.pages.first;

  // Resize the page to match the desired format
  page.width  = dims.w;
  page.height = dims.h;

  // ── 1. Background rectangle ──────────────────────────────────────────────
  const bgRect = editor.createRectangle();
  bgRect.width  = dims.w;
  bgRect.height = dims.h;
  bgRect.translation = { x: 0, y: 0 };
  bgRect.fill = editor.makeColorFill(rgb(pal.bg));
  page.artboards.first.children.append(bgRect);

  // ── 2. Accent bar (left edge) ─────────────────────────────────────────────
  const barW = Math.round(dims.w * 0.009); // ~10px on 1080
  const barH = Math.round(dims.h * 0.52);
  const barX = Math.round(dims.w * 0.074); // ~80px on 1080
  const barY = Math.round((dims.h - barH) / 2);

  const accentBar = editor.createRectangle();
  accentBar.width  = barW;
  accentBar.height = barH;
  accentBar.translation = { x: barX, y: barY };
  accentBar.fill = editor.makeColorFill(rgb(pal.accent));
  page.artboards.first.children.append(accentBar);

  // ── 3. Text block ─────────────────────────────────────────────────────────
  const textX = barX + barW + Math.round(dims.w * 0.037); // ~40px gap
  const textW = dims.w - textX - Math.round(dims.w * 0.074);

  // Headline
  const hlNode = editor.createText();
  hlNode.fullContent.text = headline;
  hlNode.translation = { x: textX, y: Math.round(dims.h * 0.38) };

  const hlRange = hlNode.fullContent;
  hlRange.applyCharacterStyles({
    fontSize:   Math.round(dims.w * 0.055), // ~60px on 1080
    fontWeight: "Bold",
    color:      rgb(pal.text)
  });
  page.artboards.first.children.append(hlNode);

  // Body
  const bodyNode = editor.createText();
  bodyNode.fullContent.text = body;
  bodyNode.translation = {
    x: textX,
    y: Math.round(dims.h * 0.38) + Math.round(dims.w * 0.055) + Math.round(dims.h * 0.018)
  };

  const bodyRange = bodyNode.fullContent;
  bodyRange.applyCharacterStyles({
    fontSize:   Math.round(dims.w * 0.024), // ~26px on 1080
    fontWeight: "Regular",
    color:      rgb(pal.subtext)
  });
  page.artboards.first.children.append(bodyNode);

  // ── 4. Microsoft logo mark (4 colored squares) ───────────────────────────
  const sqSize = Math.round(dims.w * 0.028); // ~30px on 1080
  const sqGap  = Math.round(dims.w * 0.003);
  const logoX  = Math.round(dims.w * 0.074);
  const logoY  = Math.round(dims.h * 0.074);

  const msColors = [
    { r: 0.949, g: 0.314, b: 0.133 }, // F25022 red
    { r: 0.498, g: 0.729, b: 0     }, // 7FBA00 green
    { r: 0,     g: 0.643, b: 0.937 }, // 00A4EF blue
    { r: 1,     g: 0.725, b: 0     }  // FFB900 yellow
  ];
  const offsets = [
    { dx: 0,            dy: 0 },
    { dx: sqSize + sqGap, dy: 0 },
    { dx: 0,            dy: sqSize + sqGap },
    { dx: sqSize + sqGap, dy: sqSize + sqGap }
  ];

  for (var i = 0; i < 4; i++) {
    const sq = editor.createRectangle();
    sq.width  = sqSize;
    sq.height = sqSize;
    sq.translation = { x: logoX + offsets[i].dx, y: logoY + offsets[i].dy };
    sq.fill = editor.makeColorFill(rgb(msColors[i]));
    page.artboards.first.children.append(sq);
  }
}
