import { readdirSync } from "fs";
import { join } from "path";

let counter = 0;

/**
 * better-auth's rate limiter buckets by client IP; test requests built from
 * plain Request/NextRequest objects carry no real IP, so without this every
 * test in a run would share one fallback bucket and start 429ing each other
 * after a handful of sign-ups.
 */
export function testIp(): string {
  counter += 1;
  return `10.0.${Math.floor(counter / 255)}.${counter % 255}`;
}

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
