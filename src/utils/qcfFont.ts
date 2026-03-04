// QCF per-page font loader
// V4 COLRv1: tajweed color fonts (~27KB per page)
//   6 CPAL palettes: 0=light-colored, 1=dark-colored, 2=sepia-colored,
//   3=light-mono, 4=dark-mono, 5=sepia-mono
//   No flags set → font-palette: dark/light keywords don't work,
//   must use @font-palette-values with base-palette index.
//   Firefox bug: reports font-palette as applied but doesn't render it.
//   Workaround: load OT-SVG fonts with baked-in colors for Firefox dark mode.
// V2: non-colored same-quality glyphs (~41KB per page)

const V4_CDN = "https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2";
const V4_OTSVG_DARK_CDN = "https://verses.quran.foundation/fonts/quran/hafs/v4/ot-svg/dark/woff2";
const V2_CDN = "https://verses.quran.foundation/fonts/quran/hafs/v2/woff2";

export type FontVariant = "v4" | "v2";
export type ResolvedTheme = "light" | "dark";

const isFirefox = /Firefox/.test(navigator.userAgent);

const loadedFonts = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();
const injectedPalettes = new Set<string>();

// Accumulating <style> in <head> for @font-palette-values (non-Firefox only)
let paletteStyleEl: HTMLStyleElement | null = null;
const paletteRules: string[] = [];

function injectPaletteValues(family: string): void {
  if (injectedPalettes.has(family)) return;
  injectedPalettes.add(family);

  paletteRules.push(
    `@font-palette-values --Light { font-family: "${family}"; base-palette: 0; }`,
    `@font-palette-values --Dark { font-family: "${family}"; base-palette: 1; }`
  );

  if (!paletteStyleEl) {
    paletteStyleEl = document.createElement("style");
    paletteStyleEl.id = "qcf-palettes";
    document.head.appendChild(paletteStyleEl);
  }
  paletteStyleEl.textContent = paletteRules.join("\n");
}

/** CSS font-family name for a given page, variant, and theme context. */
export function qcfFontFamily(
  pageNumber: number,
  variant: FontVariant,
  theme?: ResolvedTheme
): string {
  if (variant === "v2") return `QCF2_P${pageNumber}`;
  // Firefox dark: OT-SVG fonts use a distinct family name so both can coexist
  if (isFirefox && theme === "dark") return `QCF4D_P${pageNumber}`;
  return `QCF4_P${pageNumber}`;
}

/** Load the QCF font for a page. */
export async function loadQcfFont(
  pageNumber: number,
  variant: FontVariant = "v4",
  theme: ResolvedTheme = "light"
): Promise<void> {
  const useOtSvg = isFirefox && variant === "v4" && theme === "dark";
  const key = useOtSvg ? `v4svg_P${pageNumber}` : `${variant}_P${pageNumber}`;

  if (loadedFonts.has(key)) return;
  if (pendingLoads.has(key)) return pendingLoads.get(key);

  let cdn: string;
  if (useOtSvg) cdn = V4_OTSVG_DARK_CDN;
  else if (variant === "v4") cdn = V4_CDN;
  else cdn = V2_CDN;

  const url = `${cdn}/p${pageNumber}.woff2`;
  const family = qcfFontFamily(pageNumber, variant, theme);

  const promise = (async () => {
    const font = new FontFace(family, `url(${url})`, { display: "swap" });
    const loaded = await font.load();
    document.fonts.add(loaded);
    // Only inject palette values for COLRv1 (non-Firefox or Firefox light)
    if (variant === "v4" && !useOtSvg) injectPaletteValues(family);
    loadedFonts.add(key);
    pendingLoads.delete(key);
  })();

  pendingLoads.set(key, promise);
  return promise;
}

/** Preload a font in the background (fire-and-forget). */
export function preloadQcfFont(
  pageNumber: number,
  variant: FontVariant = "v4",
  theme: ResolvedTheme = "light"
): void {
  if (pageNumber >= 1 && pageNumber <= 604) {
    loadQcfFont(pageNumber, variant, theme).catch(() => {});
  }
}
