// Responsive layout logic (MF-08). The breakpoint decision is a pure function
// so it is unit-tested directly; the CSS media queries mirror the same numbers
// (PRS §2.2 adaptive rules: mobile < 600, tablet 600–1024, desktop > 1024).

export type Layout = 'mobile' | 'tablet' | 'desktop';

export const MOBILE_MAX = 599; // width <= 599 -> mobile
export const DESKTOP_MIN = 1025; // width >= 1025 -> desktop

export function layoutFor(widthPx: number): Layout {
  if (widthPx < 600) return 'mobile';
  if (widthPx > 1024) return 'desktop';
  return 'tablet';
}
