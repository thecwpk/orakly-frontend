import OpengraphImage, {
  alt as opengraphAlt,
  contentType as opengraphContentType,
  size as opengraphSize,
} from "./opengraph-image";

/**
 * Twitter card image. Re-uses the OG composition so the two stay in sync.
 * Per-file declarations (rather than re-exporting `runtime`) silence the
 * Next.js typegen warning about re-exported config fields.
 */

export const runtime = "edge";
export const alt = opengraphAlt;
export const size = opengraphSize;
export const contentType = opengraphContentType;

export default OpengraphImage;
