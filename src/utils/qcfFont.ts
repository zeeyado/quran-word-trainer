// QCF V4 per-page font loader (COLRv1 tajweed color fonts)

const COLRV1_CDN = "https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2";
const OTSVG_CDN = "https://verses.quran.foundation/fonts/quran/hafs/v4/ot-svg/dark/woff2";

const loadedPages = new Set<number>();
const isFirefox = typeof navigator !== "undefined" && /Firefox/i.test(navigator.userAgent);

/** CSS font-family name for a given Quran page number */
export function qcfFontFamily(pageNumber: number): string {
  return `QCF_P${pageNumber}`;
}

const pendingLoads = new Map<number, Promise<void>>();

/** Load the QCF V4 font for a page. COLRv1 by default, OT-SVG dark for Firefox. */
export async function loadQcfFont(pageNumber: number): Promise<void> {
  if (loadedPages.has(pageNumber)) return;
  if (pendingLoads.has(pageNumber)) return pendingLoads.get(pageNumber);

  const cdn = isFirefox ? OTSVG_CDN : COLRV1_CDN;
  const url = `${cdn}/p${pageNumber}.woff2`;
  const family = qcfFontFamily(pageNumber);

  const promise = (async () => {
    const font = new FontFace(family, `url(${url})`, { display: "swap" });
    const loaded = await font.load();
    document.fonts.add(loaded);
    loadedPages.add(pageNumber);
    pendingLoads.delete(pageNumber);
  })();

  pendingLoads.set(pageNumber, promise);
  return promise;
}

/** Preload a font in the background (fire-and-forget). */
export function preloadQcfFont(pageNumber: number): void {
  if (pageNumber >= 1 && pageNumber <= 604) {
    loadQcfFont(pageNumber).catch(() => {});
  }
}
