// Feature: seo-infrastructure, Property 15: Static assets have immutable cache headers

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Parse _headers file ──────────────────────────────────────────────────────

/**
 * Parse Cloudflare Pages _headers file into a map of
 * { pattern: string → headers: Record<string, string> }
 */
function parseHeadersFile(content) {
  const rules = [];
  let current = null;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trimEnd();

    // Skip blank lines and comments
    if (!line || line.trimStart().startsWith('#')) continue;

    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      // New path pattern
      current = { pattern: line.trim(), headers: {} };
      rules.push(current);
    } else if (current) {
      // Header line: "  Key: Value"
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        current.headers[key] = value;
      }
    }
  }

  return rules;
}

/**
 * Given a request path and the parsed rules, return the merged headers
 * that Cloudflare Pages would apply (rules are applied in order, later
 * rules override earlier ones for the same header key).
 */
function matchHeaders(path, rules) {
  const merged = {};

  for (const rule of rules) {
    if (pathMatchesPattern(path, rule.pattern)) {
      Object.assign(merged, rule.headers);
    }
  }

  return merged;
}

/**
 * Glob matcher for Cloudflare Pages _headers patterns.
 * In Cloudflare Pages, `*` matches any character including `/`,
 * so `/assets/*` matches `/assets/ui/logo.png`.
 */
function pathMatchesPattern(path, pattern) {
  // Escape regex special chars except `*`
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // `*` matches any character sequence including slashes (Cloudflare Pages behaviour)
  const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
  return new RegExp(regexStr).test(path);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

let rules;

beforeAll(() => {
  const headersPath = resolve(process.cwd(), 'public/_headers');
  const content = readFileSync(headersPath, 'utf-8');
  rules = parseHeadersFile(content);
});

// ─── Property 15: Static assets have immutable cache headers ─────────────────
// Validates: Requirements 4.4

describe('Property 15: Static assets have immutable cache headers', () => {
  it('paths under /assets/* have Cache-Control with immutable and max-age=31536000', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/assets/ui/logo.png',
          '/assets/ui/web.png',
          '/assets/ui/web.ico',
          '/assets/ui/web_512.png'
        ),
        (assetPath) => {
          const headers = matchHeaders(assetPath, rules);
          const cacheControl = headers['Cache-Control'] ?? '';
          expect(cacheControl).toContain('immutable');
          expect(cacheControl).toContain('max-age=31536000');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('paths under /img/* have Cache-Control with immutable and max-age=31536000', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/img/photo.jpg',
          '/img/universe-code-matrix.jpg',
          '/img/mind-cage.png',
          '/img/twain-tweet.jpg'
        ),
        (imgPath) => {
          const headers = matchHeaders(imgPath, rules);
          const cacheControl = headers['Cache-Control'] ?? '';
          expect(cacheControl).toContain('immutable');
          expect(cacheControl).toContain('max-age=31536000');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('combined: sample paths from both /assets/* and /img/* pass the cache header check', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/assets/ui/logo.png',
          '/assets/ui/web.png',
          '/img/photo.jpg',
          '/img/universe-code-matrix.jpg'
        ),
        (path) => {
          const headers = matchHeaders(path, rules);
          const cacheControl = headers['Cache-Control'] ?? '';
          expect(cacheControl).toContain('immutable');
          expect(cacheControl).toContain('max-age=31536000');
        }
      ),
      { numRuns: 100 }
    );
  });
});
