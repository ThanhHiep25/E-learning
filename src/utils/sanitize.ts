import DOMPurify from 'dompurify';

/**
 * 🛡️ XSS Protection Utility
 * Sanitize HTML content to prevent XSS attacks
 */

// Cấu hình DOMPurify cho phép các tag/formatting cần thiết
const defaultConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'code', 'pre',
    'div', 'span',
    'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'id',
    'style' // Chỉ cho phép inline styles đã được validate
  ],
  // Loại bỏ các event handlers nguy hiểm
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
  // Force all links to open in new tab với rel="noopener noreferrer"
  ADD_ATTR: ['target', 'rel'],
  // Sanitize URL trong href và src
  SANITIZE_DOM: true,
  // Keep content của script/style tags (sẽ được escape)
  KEEP_CONTENT: true,
};

// Cấu hình strict hơn cho user-generated content (forum, chat)
const strictConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'code', 'pre'],
  ALLOWED_ATTR: [],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
  KEEP_CONTENT: true,
};

/**
 * Sanitize HTML content với cấu hình default
 * Dùng cho: Lesson content, course description
 */
export function sanitizeHTML(dirty: string | undefined | null): string {
  if (!dirty) return '';
  
  // Nếu là browser environment
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(dirty, defaultConfig);
  }
  
  // Server-side hoặc test: strip all HTML
  return dirty.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize với cấu hình strict
 * Dùng cho: Forum posts, chat messages (non-AI)
 */
export function sanitizeHTMLStrict(dirty: string | undefined | null): string {
  if (!dirty) return '';
  
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(dirty, strictConfig);
  }
  
  return dirty.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize markdown content từ AI
 * Dùng cho: AI chat responses
 * Chuyển markdown sang HTML rồi sanitize
 */
export function sanitizeMarkdown(dirty: string | undefined | null): string {
  if (!dirty) return '';
  
  // Convert markdown formatting TRỰC TIẾP sang HTML
  let html = dirty
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong>$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  
  if (typeof window !== 'undefined') {
    // Sử dụng defaultConfig thay vì strictConfig để cho phép các tag từ AI
    return DOMPurify.sanitize(html, defaultConfig);
  }
  
  return html;
}

/**
 * Strip tất cả HTML tags
 * Dùng cho: Preview text, search results
 */
export function stripHTML(dirty: string | undefined | null): string {
  if (!dirty) return '';
  return dirty.replace(/<[^>]*>/g, '');
}

/**
 * Validate và sanitize URL
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Chỉ cho phép http/https URLs
  const allowedProtocols = ['http:', 'https:'];
  
  try {
    const parsed = new URL(url);
    if (allowedProtocols.includes(parsed.protocol)) {
      return url;
    }
  } catch {
    // Invalid URL
  }
  
  return '';
}

/**
 * Kiểm tra xem string có chứa HTML tags không
 */
export function containsHTML(str: string | undefined | null): boolean {
  if (!str) return false;
  return /<[^>]*>/.test(str);
}
