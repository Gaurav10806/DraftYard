import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Copy, Check } from "lucide-react";
import "highlight.js/styles/github-dark.css";

// Customized sanitize schema allowing syntax highlighting & target attributes
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className", "hljs"],
    span: [...(defaultSchema.attributes?.span || []), "className", "hljs"],
    a: [...(defaultSchema.attributes?.a || []), "target", "rel"],
    input: [...(defaultSchema.attributes?.input || []), "type", "checked", "disabled"],
  },
};

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

function CustomCodeBlock({ className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isInline = !match && !codeString.includes("\n");

  if (isInline) {
    return (
      <code
        className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[13px] font-medium text-primary border border-border/40"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-border/70 bg-[#0d1117] text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#161b22] px-4 py-2">
        <span className="font-mono text-xs font-semibold text-slate-400">
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#21262d] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-[#30363d] hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, className = "", isStreaming = false }: MarkdownRendererProps) {
  if (!content && !isStreaming) return null;

  return (
    <div className={`markdown-body space-y-3.5 text-sm leading-relaxed text-foreground/90 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeHighlight,
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="mt-5 mb-3 font-display text-xl font-bold tracking-tight text-foreground border-b border-border/50 pb-1.5">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 font-display text-lg font-bold tracking-tight text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3.5 mb-1.5 font-display text-base font-semibold text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1 font-display text-sm font-semibold text-foreground">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="mt-2 mb-1 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="mt-2 mb-1 text-xs font-semibold text-muted-foreground">
              {children}
            </h6>
          ),
          // Paragraphs & Text formatting
          p: ({ children }) => (
            <p className="leading-relaxed mb-3 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/95">
              {children}
            </em>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="my-2.5 ml-4 list-disc space-y-1.5 pl-1.5 text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2.5 ml-4 list-decimal space-y-1.5 pl-1.5 text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-3.5 border-l-4 border-primary/60 bg-muted/40 py-2.5 px-4 rounded-r-xl italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Horizontal Rule
          hr: () => <hr className="my-4 border-border/60" />,
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
            >
              {children}
            </a>
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-4 w-full overflow-x-auto rounded-xl border border-border/70 shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/80 font-semibold border-b border-border/70 text-foreground">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/50 bg-card">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-muted/30">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-foreground/90">
              {children}
            </td>
          ),
          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ""}
              className="my-3 max-w-full rounded-xl border border-border/60 shadow-sm"
              loading="lazy"
            />
          ),
          code: CustomCodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Streaming cursor indicator support for real-time LLM token streaming */}
      {isStreaming && (
        <span className="inline-block h-4 w-1.5 ml-1 animate-pulse bg-primary rounded-full align-middle" />
      )}
    </div>
  );
}

export default MarkdownRenderer;
