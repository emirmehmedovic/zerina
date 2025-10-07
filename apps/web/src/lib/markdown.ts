// Minimal, safe-ish Markdown renderer for our blog posts.
// Supports: headings (#, ##, ###), links [text](url), images ![alt](url),
// paragraphs and line breaks. Escapes HTML by default.
import { API_URL } from "@/lib/api";

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderMarkdown(md: string): string {
  let html = escapeHtml(md);

  // Images: ![alt](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (_m, alt, url) => {
    const a = String(alt || '').slice(0, 200);
    const u = String(url || '').slice(0, 2000);
    // Only allow http/https or /uploads local paths
    if (!/^https?:\/\//.test(u) && !u.startsWith('/uploads/')) return `![${a}](${u})`;
    const src = u.startsWith('/uploads/') ? `${API_URL}${u}` : u;
    return `<img src="${src}" alt="${a}" style="max-width:100%;height:auto;border-radius:12px" />`;
  });

  // Links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, (_m, text, url) => {
    const t = String(text || '').slice(0, 500);
    const u = String(url || '').slice(0, 2000);
    if (!/^https?:\/\//.test(u) && !u.startsWith('/')) return `[${t}](${u})`;
    return `<a href="${u}" target="_blank" rel="noopener noreferrer" class="text-amber-800 underline hover:no-underline">${t}</a>`;
  });

  // Headings: ###, ##, # (order matters)
  html = html.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-semibold text-amber-900 mt-6 mb-2">$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold text-amber-900 mt-8 mb-3">$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1 class="text-3xl font-bold text-amber-900 mt-10 mb-4">$1</h1>');

  // Paragraphs: split by double newlines
  html = html
    .split(/\n\n+/)
    .map(block => {
      // If block already contains block-level tags (h1,h2,h3,img), keep as is
      if (/(<h\d|<img)/.test(block)) return block;
      // Otherwise wrap as paragraph, converting single newlines to <br/>
      return `<p class="text-amber-900/90 leading-7">${block.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}
