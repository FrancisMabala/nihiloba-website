import * as React from 'react';

// offer-text-v1: mirrored in the public marketplace. Only these formatting
// tokens are supported. HTML, images and links remain inert React text.
const inlineTokens = /(\b[a-z\d][a-z\d._%+-]*@[a-z\d-]+(?:\.[a-z\d-]+)+)|\*\*([^*\n]+)\*\*|_([^_\n]+)_/gi;

function inline(value: string, depth = 0): React.ReactNode[] {
  if (depth >= 4) return [value];
  const nodes: React.ReactNode[] = [];
  let position = 0;
  for (const match of value.matchAll(inlineTokens)) {
    nodes.push(value.slice(position, match.index));
    nodes.push(match[1] ?? (match[2] !== undefined ? <strong key={match.index}>{inline(match[2],depth+1)}</strong> : <em key={match.index}>{inline(match[3],depth+1)}</em>));
    position = match.index + match[0].length;
  }
  nodes.push(value.slice(position));
  return nodes;
}

export function plainOfferText(value: string): string {
  return value.replace(inlineTokens, (_, email, bold, italic) => email ?? bold ?? italic)
    .replace(/^\s*###\s+/gm, '').replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, '');
}

export function OfferText({value}: {value: string}) {
  // Preserve the established separator used by older imported job sections.
  const lines = value.replace(/\s*;{2,}\s*/g, '\n\n').replace(/\r\n?/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  const listItem = (line: string) => /^\s*(?:([-*•])|(\d+)[.)])\s+(.+)$/.exec(line);
  for (let index = 0; index < lines.length;) {
    if (!lines[index].trim()) {index++; continue;}
    const start = index, heading = /^\s*###\s+(.+)$/.exec(lines[index]);
    if (heading) {blocks.push(<h3 key={start}>{inline(heading[1])}</h3>); index++; continue;}
    const first = listItem(lines[index]);
    if (first) {
      const ordered = !!first[2], items: React.ReactNode[] = [];
      while (index < lines.length) {
        const item = listItem(lines[index]);
        if (!item || !!item[2] !== ordered) break;
        items.push(<li key={index}>{inline(item[3])}</li>); index++;
      }
      blocks.push(ordered ? <ol key={start} start={Number(first[2])}>{items}</ol> : <ul key={start}>{items}</ul>);
      continue;
    }
    const paragraph: React.ReactNode[] = [];
    while (index < lines.length && lines[index].trim() && !listItem(lines[index]) && !/^\s*###\s+/.test(lines[index])) {
      if (paragraph.length) paragraph.push(<br key={`break-${index}`}/>);
      paragraph.push(<React.Fragment key={index}>{inline(lines[index])}</React.Fragment>); index++;
    }
    blocks.push(<p key={start}>{paragraph}</p>);
  }
  return <div className="offer-formatted-text">{blocks}</div>;
}
