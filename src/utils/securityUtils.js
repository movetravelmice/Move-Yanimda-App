/**
 * HTML Sanitizer & Security Helpers
 * Prevents XSS (Cross-Site Scripting) attacks when rendering rich text content
 * via dangerouslySetInnerHTML across the application.
 */

const FORBIDDEN_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'link',
  'style',
  'svg',
  'math'
];

/**
 * Sanitizes an HTML string by removing dangerous tags (script, iframe, object, etc.),
 * inline event handlers (onerror, onload, onclick, etc.), and dangerous URI schemes
 * (javascript:, vbscript:, data:text/html).
 *
 * @param {string} dirtyHtml
 * @returns {string} Safe HTML string
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  // Fast regex pre-pass for script/iframe/style tags and event attributes
  let cleaned = dirtyHtml
    .replace(/<\s*(script|iframe|object|embed|applet|meta|base|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|applet|meta|base|form|input|button|textarea|select|link)[^>]*\/?>/gi, '');

  // Use DOMParser when available in browser environment for thorough AST sanitization
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(cleaned, 'text/html');

      // Remove forbidden elements
      FORBIDDEN_TAGS.forEach((tag) => {
        const elements = doc.body.querySelectorAll(tag);
        elements.forEach((el) => el.remove());
      });

      // Walk all remaining elements and strip dangerous attributes
      const allElements = doc.body.querySelectorAll('*');
      allElements.forEach((el) => {
        const attrs = Array.from(el.attributes);
        attrs.forEach((attr) => {
          const name = attr.name.toLowerCase();
          const val = (attr.value || '').trim();
          const normalizedVal = val.replace(/[\s\x00-\x1f]+/g, '').toLowerCase();

          // Strip any inline event handler (onclick, onerror, onload, onmouseover, etc.)
          if (name.startsWith('on')) {
            el.removeAttribute(attr.name);
            return;
          }

          // Strip dangerous protocols in URL attributes
          if (['href', 'src', 'xlink:href', 'action', 'formaction', 'data', 'poster'].includes(name)) {
            if (
              normalizedVal.startsWith('javascript:') ||
              normalizedVal.startsWith('vbscript:') ||
              normalizedVal.startsWith('data:text/html') ||
              normalizedVal.startsWith('data:application/')
            ) {
              el.removeAttribute(attr.name);
              return;
            }
          }

          // Strip CSS expressions or javascript URLs inside inline style
          if (name === 'style') {
            if (
              normalizedVal.includes('expression(') ||
              normalizedVal.includes('javascript:') ||
              normalizedVal.includes('vbscript:') ||
              normalizedVal.includes('-moz-binding')
            ) {
              el.removeAttribute(attr.name);
            }
          }
        });

        // Enforce rel="noopener noreferrer" on external links
        if (el.tagName.toLowerCase() === 'a' && el.getAttribute('target') === '_blank') {
          el.setAttribute('rel', 'noopener noreferrer');
        }
      });

      return doc.body.innerHTML;
    } catch (e) {
      // Fallback to regex sanitization if DOMParser fails
    }
  }

  // Fallback regex sanitizer
  return cleaned
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|action)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '');
}
