// Pure helpers for AppNode CDN `@import` parsing + CDN allow-listing.
//
// Kept dependency-free (no Convex/runtime/React imports) so the exact same
// logic can run in three places:
//   - the frontend srcdoc builder (src/lib/buildSrcdoc.ts), to inject scripts
//   - the agent tools (set_node_data / patch_app_node_code), for fast feedback
//   - unit tests
//
// Syntax (one per line, at the top of the app code):
//   // @import <global> <https-url>
// `<global>` is documentary only — a classic <script> tag cannot rename the
// global a UMD bundle defines (lodash is `_`, d3 is `d3`, ...). It is kept for
// readability and error messages.

export type AppImport = { name: string; url: string };

export type ParsedImports = {
  imports: AppImport[];
  errors: string[];
};

// Registrable domains of CDNs we trust to serve UMD/global builds.
// esm.sh is intentionally excluded: it serves ES modules, which do not attach a
// global via a classic <script> tag and so don't fit the "globals only" model.
export const ALLOWED_CDN_DOMAINS = [
  "jsdelivr.net",
  "unpkg.com",
  "cdnjs.cloudflare.com",
];

/**
 * True only for HTTPS URLs whose host is one of the trusted CDN domains, or a
 * subdomain of one. The leading-dot check (`"." + domain`) is what prevents the
 * classic `endsWith` bypass where `evil-jsdelivr.net` would slip through.
 */
export function isAllowedCDN(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_CDN_DOMAINS.some(
    (domain) => host === domain || host.endsWith("." + domain),
  );
}

/**
 * Extracts `// @import <name> <url>` declarations from app code.
 * Returns the valid (de-duplicated by URL) imports plus human-readable errors
 * for any declaration pointing at a disallowed origin / malformed URL.
 * Never throws.
 */
export function parseImports(code: string): ParsedImports {
  const importRe = /^[ \t]*\/\/[ \t]*@import[ \t]+(\S+)[ \t]+(\S+)[ \t]*$/gm;
  const imports: AppImport[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const match of code.matchAll(importRe)) {
    const name = match[1];
    const url = match[2];
    if (!isAllowedCDN(url)) {
      errors.push(
        `CDN non autorisé pour "${name}": ${url}. ` +
          `Origines autorisées (HTTPS uniquement) : ${ALLOWED_CDN_DOMAINS.join(", ")}.`,
      );
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    imports.push({ name, url });
  }

  return { imports, errors };
}
