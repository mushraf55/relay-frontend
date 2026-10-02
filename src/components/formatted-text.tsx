import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={index}>{token.slice(1, -1)}</code>;
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    return <Fragment key={index}>{token}</Fragment>;
  });
}

export function FormattedText({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, "").split("\n"); const blocks: ReactNode[] = []; let paragraph: string[] = [];
  const flush = () => { if (paragraph.length) { blocks.push(<p key={`p-${blocks.length}`}>{inline(paragraph.join(" "))}</p>); paragraph = []; } };
  for (let index = 0; index < lines.length; index++) {
    const value = lines[index].trim();
    if (!value) { flush(); continue; }
    const heading = value.match(/^(#{1,4})\s+(.+)$/);
    if (heading) { flush(); const Tag = `h${Math.min(heading[1].length + 2, 6)}` as "h3" | "h4" | "h5" | "h6"; blocks.push(<Tag key={`h-${index}`}>{inline(heading[2])}</Tag>); continue; }
    if (/^[-*]\s+/.test(value)) {
      flush(); const items = [value.replace(/^[-*]\s+/, "")];
      while (index + 1 < lines.length && /^\s*[-*]\s+/.test(lines[index + 1])) items.push(lines[++index].trim().replace(/^[-*]\s+/, ""));
      blocks.push(<ul key={`ul-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ul>); continue;
    }
    if (/^\d+\.\s+/.test(value)) {
      flush(); const items = [value.replace(/^\d+\.\s+/, "")];
      while (index + 1 < lines.length && /^\s*\d+\.\s+/.test(lines[index + 1])) items.push(lines[++index].trim().replace(/^\d+\.\s+/, ""));
      blocks.push(<ol key={`ol-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ol>); continue;
    }
    if (value.startsWith("> ")) { flush(); blocks.push(<blockquote key={`q-${index}`}>{inline(value.slice(2))}</blockquote>); continue; }
    paragraph.push(value);
  }
  flush();
  return <div className={`formatted-text ${className}`.trim()}>{blocks}</div>;
}
