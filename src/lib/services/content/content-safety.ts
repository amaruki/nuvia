/**
 * Write-time HTML guard for authored content (security issue #1).
 *
 * The product authors content as plain text: the dashboard editor is a plain
 * textarea, seeds ship plain text, and every read surface (public news, member
 * inbox, moderation widget) renders `content` as escaped text. No legitimate
 * HTML path exists, so any markup in the write payload is rejected outright
 * rather than stored for a future sink to render unsafely.
 *
 * This is defense-in-depth: the rendering sinks themselves never interpolate
 * content as HTML (the one `dangerouslySetInnerHTML` sink was removed).
 */
import { ContentApiError } from "./errors";

/**
 * Tags whose mere presence can execute script or load a remote payload even
 * without attributes: `<script src=...>`, `<iframe srcdoc=...>`, `<object
 * data=...>`, `<svg onload=...>`, `<math href=javascript:...>`, etc.
 * Rejected up front with a dedicated message.
 */
const DANGEROUS_TAG = /<(script|iframe|object|embed|svg|math|form|meta|link|base)\b/i;

/** Any other markup-like token: an opening tag `<tag` or a closing tag `</tag`. */
const ANY_TAG = /<\/?[a-z][a-z0-9]*[\s>/]/i;

/** Inline event handlers and javascript: URLs anywhere in the text. */
const EVENT_OR_JS_URL = /\bon[a-z]+\s*=|javascript\s*:/i;

/**
 * Throw a 400 when `content` contains HTML markup. Plain text - including
 * angle-bracket prose like "use `<div>` carefully" written with backticks in
 * prose - is rejected too: the authoring model is plain text, and the cost of
 * the occasional legitimate technical snippet is far lower than a stored-XSS
 * hole. Writers that need code formatting should migrate to Markdown (tracked
 * separately).
 */
export function assertPlainTextContent(content: string, field = "content"): void {
  if (DANGEROUS_TAG.test(content)) {
    throw ContentApiError.badRequest(
      `${field} must be plain text - HTML markup (scripts, iframes, SVG, etc.) is not allowed`,
    );
  }
  if (EVENT_OR_JS_URL.test(content)) {
    throw ContentApiError.badRequest(
      `${field} must be plain text - inline event handlers and javascript: URLs are not allowed`,
    );
  }
  if (ANY_TAG.test(content)) {
    throw ContentApiError.badRequest(
      `${field} must be plain text - HTML markup is not allowed. Remove all HTML tags.`,
    );
  }
}
