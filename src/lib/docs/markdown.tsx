/**
 * Markdown rendering for the documentation portal (UI-40).
 *
 * Runtime rendering with react-markdown + remark-gfm + rehype-slug: the
 * docs/ tree stays the single source of truth and no build-time MDX
 * configuration is needed (D14). All styling uses theme tokens
 * (text-foreground, text-muted-foreground, border, bg-card, bg-muted) so
 * the prose reads well in light and dark themes alike. Server components
 * only — ADR-0006.
 */
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { portalHrefForRepoPath } from "./registry";

const LINK_CLASSES =
  "font-medium text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground";

/**
 * Resolve a relative markdown href (e.g. "01-overview.md#intro") against
 * the document it appears in, mapping it onto a portal URL when the target
 * has one. Pure in-docs paths only; anything escaping docs/ returns null.
 */
function resolveDocHref(href: string, sourceRepoPath: string | undefined): string | null {
  if (!sourceRepoPath) return null;
  const hashIndex = href.indexOf("#");
  const pathPart = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const anchor = hashIndex === -1 ? "" : href.slice(hashIndex);
  if (!pathPart) return null; // pure in-page anchor, leave as-is

  const sourceDir = sourceRepoPath.includes("/")
    ? sourceRepoPath.slice(0, sourceRepoPath.lastIndexOf("/"))
    : "";
  const segments: string[] = [];
  for (const part of `${sourceDir}/${decodeURIComponent(pathPart)}`.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (segments.length === 0) return null; // escapes docs/
      segments.pop();
      continue;
    }
    segments.push(part);
  }
  const portalHref = portalHrefForRepoPath(segments.join("/"));
  return portalHref ? `${portalHref}${anchor}` : null;
}

export function buildComponents(sourceRepoPath: string | undefined): Components {
  return {
    h1({ node: _node, children, ...props }) {
      return (
        <h1
          {...props}
          className="mt-10 mb-4 text-3xl font-bold tracking-tight text-foreground first:mt-0"
        >
          {children}
        </h1>
      );
    },
    h2({ node: _node, children, ...props }) {
      return (
        <h2
          {...props}
          className="mt-10 mb-3 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground"
        >
          {children}
        </h2>
      );
    },
    h3({ node: _node, children, ...props }) {
      return (
        <h3 {...props} className="mt-8 mb-2 text-xl font-semibold text-foreground">
          {children}
        </h3>
      );
    },
    h4({ node: _node, children, ...props }) {
      return (
        <h4 {...props} className="mt-6 mb-2 text-lg font-semibold text-foreground">
          {children}
        </h4>
      );
    },
    h5({ node: _node, children, ...props }) {
      return (
        <h5 {...props} className="mt-6 mb-2 text-base font-semibold text-foreground">
          {children}
        </h5>
      );
    },
    h6({ node: _node, children, ...props }) {
      return (
        <h6 {...props} className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">
          {children}
        </h6>
      );
    },
    p({ node: _node, children, ...props }) {
      return (
        <p {...props} className="my-4 leading-relaxed text-foreground/90">
          {children}
        </p>
      );
    },
    a({ node: _node, href, children, ...props }) {
      if (href && /^https?:\/\//i.test(href)) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
            className={LINK_CLASSES}
          >
            {children}
          </a>
        );
      }
      const resolved = href ? resolveDocHref(href, sourceRepoPath) : null;
      return (
        <a href={resolved ?? href} {...props} className={LINK_CLASSES}>
          {children}
        </a>
      );
    },
    ul({ node: _node, children, ...props }) {
      return (
        <ul {...props} className="my-4 list-disc space-y-2 pl-6 text-foreground/90">
          {children}
        </ul>
      );
    },
    ol({ node: _node, children, ...props }) {
      return (
        <ol {...props} className="my-4 list-decimal space-y-2 pl-6 text-foreground/90">
          {children}
        </ol>
      );
    },
    li({ node: _node, children, ...props }) {
      return (
        <li {...props} className="leading-relaxed">
          {children}
        </li>
      );
    },
    blockquote({ node: _node, children, ...props }) {
      return (
        <blockquote
          {...props}
          className="my-6 border-l-4 border-border pl-4 text-muted-foreground italic"
        >
          {children}
        </blockquote>
      );
    },
    pre({ node: _node, children, ...props }) {
      return (
        <pre
          {...props}
          className="my-6 overflow-x-auto rounded-lg border border-border bg-muted p-4"
        >
          {children}
        </pre>
      );
    },
    code({ node: _node, className, children, ...props }) {
      const text = String(children ?? "");
      const isBlock = /language-/.test(className ?? "") || text.includes("\n");
      if (isBlock) {
        return (
          <code {...props} className="font-mono text-sm text-foreground">
            {children}
          </code>
        );
      }
      return (
        <code
          {...props}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em] text-foreground"
        >
          {children}
        </code>
      );
    },
    table({ node: _node, children, ...props }) {
      return (
        <div className="my-6 w-full overflow-x-auto rounded-lg border border-border">
          <table {...props} className="w-full border-collapse text-sm">
            {children}
          </table>
        </div>
      );
    },
    th({ node: _node, children, ...props }) {
      return (
        <th
          {...props}
          className="border-b border-border bg-muted px-3 py-2 text-left font-semibold text-foreground"
        >
          {children}
        </th>
      );
    },
    td({ node: _node, children, ...props }) {
      return (
        <td {...props} className="border-b border-border px-3 py-2 align-top text-foreground/90">
          {children}
        </td>
      );
    },
    hr({ node: _node, ...props }) {
      return <hr {...props} className="my-8 border-border" />;
    },
    img({ node: _node, alt, ...props }) {
      return (
        <img
          alt={alt ?? ""}
          {...props}
          className="my-6 max-w-full rounded-lg border border-border"
        />
      );
    },
    strong({ node: _node, children, ...props }) {
      return (
        <strong {...props} className="font-semibold text-foreground">
          {children}
        </strong>
      );
    },
  };
}

/**
 * Server component rendering a markdown document directly in the RSC
 * graph. Next.js forbids importing react-dom/server into server
 * components, and react-markdown renders plain elements server-side, so
 * the document is returned as elements rather than an HTML string.
 * Heading ids come from rehype-slug, so deep links like #context work.
 */
export function DocMarkdown({
  markdown,
  sourceRepoPath,
}: {
  markdown: string;
  sourceRepoPath?: string;
}) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={buildComponents(sourceRepoPath)}
    >
      {markdown}
    </Markdown>
  );
}
