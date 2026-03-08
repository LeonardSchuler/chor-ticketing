/**
 * HTML utility functions for secure HTML generation
 */

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Converts characters like <, >, &, ", ' to their HTML entity equivalents.
 *
 * @param str - The string to escape
 * @returns The escaped string safe for HTML insertion
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escapes HTML attributes to prevent attribute-context XSS.
 * Similar to escapeHtml but specifically designed for attribute values.
 *
 * @param str - The string to escape for use in HTML attributes
 * @returns The escaped string safe for HTML attribute insertion
 *
 * @example
 * const id = escapeHtmlAttribute(userId);
 * `<div id="${id}">...</div>`
 */
export function escapeHtmlAttribute(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
