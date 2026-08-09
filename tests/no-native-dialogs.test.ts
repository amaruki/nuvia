/**
 * UI-06 guard (docs/planning/03-frontend-improvement-plan.md): the backoffice
 * has exactly one feedback idiom — toasts (sonner) and AlertDialog. Native
 * blocking dialogs (`alert()`, `confirm()`, `window.alert()`,
 * `window.confirm()`) are banned in src/.
 *
 * The scanner strips comments and string literals first, then matches live
 * call sites only. AlertDialog-family identifiers (AlertDialog, onConfirm,
 * confirmText, confirmation, ...) never match because the regexes require the
 * bare lowercase token immediately followed by `(` with no `.` or word
 * character in front.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const ROOT = join(import.meta.dir, "..");
const SRC_DIR = join(ROOT, "src");

/** Every `.ts`/`.tsx` file under `dir`, skipping node-* and hidden dirs. */
export function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("node") || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Blank out `//` line comments, block comments, and string-literal contents
 * (newlines preserved so line numbers stay stable). Template-literal
 * `${...}` interpolations are kept as code; nothing else survives.
 */
export function stripCommentsAndStrings(source: string): string {
  let out = "";
  let mode: "code" | "line" | "block" | "single" | "double" | "template" = "code";
  // Brace depth recorded when each open `${` was entered, so the matching `}`
  // can return us to the surrounding template literal.
  const templateStack: number[] = [];
  let braceDepth = 0;
  let i = 0;

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line";
        out += "  ";
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        mode = "block";
        out += "  ";
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "single";
        out += " ";
        i += 1;
        continue;
      }
      if (ch === '"') {
        mode = "double";
        out += " ";
        i += 1;
        continue;
      }
      if (ch === "`") {
        mode = "template";
        out += " ";
        i += 1;
        continue;
      }
      if (ch === "{") {
        braceDepth += 1;
      } else if (ch === "}") {
        braceDepth -= 1;
        if (templateStack.length > 0 && braceDepth === templateStack[templateStack.length - 1]) {
          templateStack.pop();
          mode = "template";
          out += " ";
          i += 1;
          continue;
        }
      }
      out += ch;
      i += 1;
      continue;
    }

    if (mode === "line") {
      if (ch === "\n") {
        mode = "code";
        out += "\n";
      } else {
        out += " ";
      }
      i += 1;
      continue;
    }

    if (mode === "block") {
      if (ch === "*" && next === "/") {
        mode = "code";
        out += "  ";
        i += 2;
        continue;
      }
      out += ch === "\n" ? "\n" : " ";
      i += 1;
      continue;
    }

    if (mode === "single" || mode === "double") {
      const quote = mode === "single" ? "'" : '"';
      if (ch === "\\") {
        out += "  ";
        i += 2;
        continue;
      }
      if (ch === quote) {
        mode = "code";
        out += " ";
        i += 1;
        continue;
      }
      if (ch === "\n") {
        // Unterminated string; recover instead of swallowing the file.
        mode = "code";
        out += "\n";
        i += 1;
        continue;
      }
      out += " ";
      i += 1;
      continue;
    }

    // mode === "template"
    if (ch === "\\") {
      out += "  ";
      i += 2;
      continue;
    }
    if (ch === "`") {
      mode = "code";
      out += " ";
      i += 1;
      continue;
    }
    if (ch === "$" && next === "{") {
      templateStack.push(braceDepth);
      braceDepth += 1;
      mode = "code";
      out += "  ";
      i += 2;
      continue;
    }
    out += ch === "\n" ? "\n" : " ";
    i += 1;
  }

  return out;
}

export interface DialogHit {
  file: string;
  line: number;
  snippet: string;
}

/** Bare `alert(`/`confirm(` plus explicit `window.`/`globalThis.` members. */
const BARE_CALL = /(^|[^.\w])(alert|confirm)\s*\(/g;
const MEMBER_CALL = /(?:window|globalThis)\.(alert|confirm)\s*\(/g;

/** Live native-dialog call sites in one source file. */
export function findNativeDialogHits(file: string, source: string): DialogHit[] {
  const stripped = stripCommentsAndStrings(source);
  const lines = source.split("\n");
  const hits: DialogHit[] = [];
  const seen = new Set<number>();

  const record = (match: RegExpExecArray) => {
    const index = match.index + match[0].lastIndexOf(match[2]);
    if (seen.has(index)) return;
    seen.add(index);
    const line = stripped.slice(0, index).split("\n").length;
    hits.push({ file, line, snippet: (lines[line - 1] ?? "").trim() });
  };

  for (const pattern of [BARE_CALL, MEMBER_CALL]) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(stripped)) !== null) {
      record(match);
    }
  }

  return hits.sort((a, b) => a.line - b.line);
}

/** Scan every `.ts`/`.tsx` file under `src/` for native dialog call sites. */
export function scanNativeDialogs(): DialogHit[] {
  const hits: DialogHit[] = [];
  for (const file of collectSourceFiles(SRC_DIR)) {
    hits.push(...findNativeDialogHits(file, readFileSync(file, "utf8")));
  }
  return hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

export function formatHit(hit: DialogHit): string {
  return `${relative(ROOT, hit.file)}:${hit.line}  ${hit.snippet}`;
}

describe("UI-06: native alert()/confirm() are banned in src/", () => {
  const hits = scanNativeDialogs();

  test("no live native dialog call sites remain anywhere in src/", () => {
    expect(hits.map(formatHit)).toEqual([]);
  });
});
