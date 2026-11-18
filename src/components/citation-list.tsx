export type Citation = {
  number: number;
  sourceId: string;
  title: string;
  sourceUrl?: string | null;
  excerpt: string;
};

export function CitationList({ citations }: { citations?: Citation[] }) {
  if (!citations?.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2" aria-label="Answer sources">
    {citations.map(citation => {
      const content = <span className="font-medium">[{citation.number}] {citation.title}</span>;
      return citation.sourceUrl
        ? <a className="inline-flex max-w-full rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted" href={citation.sourceUrl} key={citation.sourceId} target="_blank" rel="noreferrer">{content}</a>
        : <div className="inline-flex max-w-full rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground" key={citation.sourceId}>{content}</div>;
    })}
  </div>;
}
