import { renderMarkdown } from "@/lib/folio/markdown";

export function MarkdownView({ source }: { source: string }) {
  return <div className="folio-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />;
}
