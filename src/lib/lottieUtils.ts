/** Converts Lottie 0-1 RGB values to a hex string */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

/** Returns whether an array looks like a static Lottie color [r, g, b] or [r, g, b, a] with values in 0-1 */
function isColorArray(k: unknown[]): boolean {
  if (k.length < 3 || k.length > 4) return false;
  return k.slice(0, 3).every((v) => typeof v === "number" && v >= 0 && v <= 1);
}

/**
 * Extracts all unique static colors from a Lottie JSON.
 * Finds fill (ty=fl), stroke (ty=st) color properties and solid layer colors (sc).
 */
/**
 * Extracts unique hex colors from raw SVG markup.
 * Looks at fill, stroke, stop-color attributes and inline style properties.
 */
export function extractSvgColors(svgContent: string): string[] {
  const colors = new Set<string>();

  // Match hex colors in fill="", stroke="", stop-color="", and style=""
  const attrRegex = /(?:fill|stroke|stop-color|color)\s*[:=]\s*["']?\s*(#[0-9a-fA-F]{3,6})\b/g;
  let m;
  while ((m = attrRegex.exec(svgContent)) !== null) {
    let hex = m[1].toLowerCase();
    // Expand shorthand #abc → #aabbcc
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    if (hex !== "#000000" || svgContent.includes(m[0])) {
      colors.add(hex);
    }
  }

  // Also match rgb() values
  const rgbRegex = /(?:fill|stroke|stop-color|color)\s*[:=]\s*["']?\s*rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;
  while ((m = rgbRegex.exec(svgContent)) !== null) {
    const toHex = (v: number) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0");
    colors.add(`#${toHex(parseInt(m[1]))}${toHex(parseInt(m[2]))}${toHex(parseInt(m[3]))}`);
  }

  return Array.from(colors);
}

/**
 * Applies color overrides to raw SVG markup by replacing hex values in
 * fill, stroke, stop-color, and color attributes/style properties.
 */
export function applySvgColorOverrides(svgContent: string, overrides: Record<string, string>): string {
  if (!Object.keys(overrides).length) return svgContent;

  // Build a map that also includes shorthand variants
  const map = new Map<string, string>();
  for (const [from, to] of Object.entries(overrides)) {
    map.set(from.toLowerCase(), to.toLowerCase());
  }

  // Replace hex colors in relevant attribute/style contexts
  return svgContent.replace(
    /((?:fill|stroke|stop-color|color)\s*[:=]\s*["']?\s*)(#[0-9a-fA-F]{3,6})\b/g,
    (match, prefix: string, hex: string) => {
      let normalized = hex.toLowerCase();
      // Expand shorthand #abc → #aabbcc
      if (normalized.length === 4) {
        normalized = `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
      }
      const replacement = map.get(normalized);
      return replacement ? `${prefix}${replacement}` : match;
    }
  );
}

export function extractColors(data: Record<string, unknown>): string[] {
  const colors = new Set<string>();

  function walk(obj: unknown) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }

    const record = obj as Record<string, unknown>;

    // Fill / stroke color property: { c: { a: 0, k: [r, g, b, a?] } }
    if (record.c && typeof record.c === "object" && !Array.isArray(record.c)) {
      const c = record.c as Record<string, unknown>;
      if (c.a === 0 && Array.isArray(c.k) && isColorArray(c.k as unknown[])) {
        const k = c.k as number[];
        colors.add(rgbToHex(k[0], k[1], k[2]));
      }
    }

    // Solid layer color: sc is a hex string
    if (typeof record.sc === "string" && /^#[0-9a-fA-F]{6}$/.test(record.sc)) {
      colors.add(record.sc.toLowerCase());
    }

    for (const val of Object.values(record)) {
      walk(val);
    }
  }

  walk(data);
  return Array.from(colors);
}

/**
 * Deep clones the Lottie data, applies color overrides and removes hidden layers.
 */
export function applyModifications(
  data: Record<string, unknown>,
  colorOverrides: Record<string, string>,
  hiddenLayerIndices: number[],
  speed?: number,
): Record<string, unknown> {
  const clone: Record<string, unknown> = JSON.parse(JSON.stringify(data));

  // Apply color overrides
  const hasOverrides = Object.keys(colorOverrides).length > 0;
  if (hasOverrides) {
    function walkColors(obj: unknown) {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        obj.forEach(walkColors);
        return;
      }

      const record = obj as Record<string, unknown>;

      if (record.c && typeof record.c === "object" && !Array.isArray(record.c)) {
        const c = record.c as Record<string, unknown>;
        if (c.a === 0 && Array.isArray(c.k) && isColorArray(c.k as unknown[])) {
          const k = c.k as number[];
          const hex = rgbToHex(k[0], k[1], k[2]);
          if (colorOverrides[hex]) {
            const [r, g, b] = hexToRgb(colorOverrides[hex]);
            k[0] = r;
            k[1] = g;
            k[2] = b;
          }
        }
      }

      if (typeof record.sc === "string" && /^#[0-9a-fA-F]{6}$/.test(record.sc)) {
        const sc = record.sc.toLowerCase();
        if (colorOverrides[sc]) {
          record.sc = colorOverrides[sc];
        }
      }

      for (const val of Object.values(record)) {
        walkColors(val);
      }
    }
    walkColors(clone);
  }

  // Remove hidden layers
  if (hiddenLayerIndices.length > 0 && Array.isArray(clone.layers)) {
    const hiddenSet = new Set(hiddenLayerIndices);
    clone.layers = (clone.layers as unknown[]).filter((_, i) => !hiddenSet.has(i));
  }

  // Apply speed by modifying frame rate
  if (speed && speed !== 1 && typeof clone.fr === "number") {
    clone.fr = clone.fr * speed;
  }

  return clone;
}
