export function markdownToHtml(md: string): string {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,      '<code>$1</code>')
    .replace(/^> (.+)$/gm,    '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm,    '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, m => `<ul>${m}</ul>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[(.*)\]\((.+?)\)/g, '<img alt="$1" src="$2" loading="lazy">')
    .replace(/\n\n/g, '</p><p>');
}
