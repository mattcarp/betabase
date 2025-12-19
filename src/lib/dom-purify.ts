import DOMPurify from "dompurify";

/**
 * Safely sanitizes HTML content for use with dangerouslySetInnerHTML.
 * Handles SSR by returning the original content on the server, 
 * as DOMPurify requires a DOM window to function.
 */
export const sanitizeHtml = (html: string): string => {
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(html);
  }
  return html;
};

export default sanitizeHtml;

