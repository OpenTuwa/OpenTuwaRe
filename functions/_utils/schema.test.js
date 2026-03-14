// Feature: seo-infrastructure, Property 6: Article @graph completeness
// Feature: seo-infrastructure, Property 7: dateModified never precedes datePublished
// Feature: seo-infrastructure, Property 8: Tags round-trip to keywords string

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildArticleGraph, buildHomepageGraph, buildArchiveGraph } from './schema.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidIso(str) {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime()) && str !== 'Invalid Date';
}

// Arbitrary for a valid ISO date string
const fcIsoDate = fc.integer({ min: 946684800000, max: 1924991999000 })
  .map(ms => new Date(ms).toISOString());

// Arbitrary for an article record
const fcArticle = fc.record({
  slug: fc.stringMatching(/^[a-z0-9-]{1,40}$/),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  seo_description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  image_url: fc.option(fc.webUrl(), { nil: undefined }),
  author: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  published_at: fc.option(fcIsoDate, { nil: undefined }),
  updated_at: fc.option(fcIsoDate, { nil: undefined }),
  tags: fc.option(
    fc.oneof(
      fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }).map(a => JSON.stringify(a)),
      fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }).map(a => a.join(', '))
    ),
    { nil: undefined }
  ),
  section: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

// ─── Property 6: Article @graph completeness ─────────────────────────────────
// Validates: Requirements 2.1

describe('Property 6: Article @graph completeness', () => {
  it('graph contains NewsArticle, Person, NewsMediaOrganization, BreadcrumbList', () => {
    fc.assert(
      fc.property(fcArticle, (article) => {
        const graph = buildArticleGraph(article);
        expect(Array.isArray(graph)).toBe(true);

        const types = graph.map(n => n['@type']);
        expect(types).toContain('NewsArticle');
        expect(types).toContain('Person');
        expect(types).toContain('NewsMediaOrganization');
        expect(types).toContain('BreadcrumbList');
      }),
      { numRuns: 100 }
    );
  });

  it('NewsArticle node has required fields', () => {
    fc.assert(
      fc.property(fcArticle, (article) => {
        const graph = buildArticleGraph(article);
        const node = graph.find(n => n['@type'] === 'NewsArticle');
        expect(node).toBeDefined();
        expect(typeof node.headline).toBe('string');
        expect(node['@id']).toMatch(/^https?:\/\//);
        expect(node.mainEntityOfPage).toBeDefined();
        expect(node.publisher).toBeDefined();
        expect(node.author).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('never emits null or "Invalid Date" for datePublished or dateModified', () => {
    fc.assert(
      fc.property(fcArticle, (article) => {
        const graph = buildArticleGraph(article);
        const node = graph.find(n => n['@type'] === 'NewsArticle');
        if (node.datePublished !== undefined) {
          expect(node.datePublished).not.toBeNull();
          expect(node.datePublished).not.toBe('Invalid Date');
          expect(isValidIso(node.datePublished)).toBe(true);
        }
        if (node.dateModified !== undefined) {
          expect(node.dateModified).not.toBeNull();
          expect(node.dateModified).not.toBe('Invalid Date');
          expect(isValidIso(node.dateModified)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('omits image node when image_url is empty', () => {
    const article = { slug: 'test', title: 'Test', image_url: '' };
    const graph = buildArticleGraph(article);
    const node = graph.find(n => n['@type'] === 'NewsArticle');
    expect(node.image).toBeUndefined();
  });

  it('resolves relative image_url to absolute', () => {
    const article = { slug: 'test', title: 'Test', image_url: '/img/photo.jpg' };
    const graph = buildArticleGraph(article);
    const node = graph.find(n => n['@type'] === 'NewsArticle');
    expect(node.image.url).toBe('https://opentuwa.com/img/photo.jpg');
  });
});

// ─── Property 7: dateModified never precedes datePublished ───────────────────
// Validates: Requirements 2.2

describe('Property 7: dateModified never precedes datePublished', () => {
  it('dateModified >= datePublished for any date pair', () => {
    const fcMs = fc.integer({ min: 946684800000, max: 1924991999000 });
    fc.assert(
      fc.property(fc.tuple(fcMs, fcMs), ([ms1, ms2]) => {
        const published_at = new Date(ms1).toISOString();
        const updated_at = new Date(ms2).toISOString();
        const article = { slug: 'x', title: 'X', published_at, updated_at };
        const graph = buildArticleGraph(article);
        const node = graph.find(n => n['@type'] === 'NewsArticle');

        if (node.datePublished && node.dateModified) {
          expect(node.dateModified >= node.datePublished).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('falls back to published_at when updated_at is earlier', () => {
    const article = {
      slug: 'test',
      title: 'Test',
      published_at: '2025-06-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z', // earlier than published_at
    };
    const graph = buildArticleGraph(article);
    const node = graph.find(n => n['@type'] === 'NewsArticle');
    expect(node.dateModified).toBe('2025-06-01T00:00:00.000Z');
  });

  it('falls back to published_at when updated_at is missing', () => {
    const article = {
      slug: 'test',
      title: 'Test',
      published_at: '2025-06-01T00:00:00.000Z',
    };
    const graph = buildArticleGraph(article);
    const node = graph.find(n => n['@type'] === 'NewsArticle');
    expect(node.dateModified).toBe('2025-06-01T00:00:00.000Z');
  });

  it('omits datePublished and dateModified when published_at is missing', () => {
    const article = { slug: 'test', title: 'Test' };
    const graph = buildArticleGraph(article);
    const node = graph.find(n => n['@type'] === 'NewsArticle');
    expect(node.datePublished).toBeUndefined();
    expect(node.dateModified).toBeUndefined();
  });
});

// ─── Property 8: Tags round-trip to keywords string ──────────────────────────
// Validates: Requirements 2.4

describe('Property 8: Tags round-trip to keywords string', () => {
  it('JSON array tags produce comma-separated keywords', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(',')), { minLength: 1, maxLength: 10 }),
        (tags) => {
          const article = { slug: 'x', title: 'X', tags: JSON.stringify(tags) };
          const graph = buildArticleGraph(article);
          const node = graph.find(n => n['@type'] === 'NewsArticle');
          expect(node.keywords).toBeDefined();
          const kwArray = node.keywords.split(', ');
          for (const tag of tags) {
            expect(kwArray).toContain(tag);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('CSV string tags produce comma-separated keywords', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(',') && s.trim() === s), { minLength: 1, maxLength: 10 }),
        (tags) => {
          const article = { slug: 'x', title: 'X', tags: tags.join(', ') };
          const graph = buildArticleGraph(article);
          const node = graph.find(n => n['@type'] === 'NewsArticle');
          expect(node.keywords).toBeDefined();
          const kwArray = node.keywords.split(', ');
          for (const tag of tags) {
            expect(kwArray).toContain(tag);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('omits keywords when tags is empty', () => {
    const article = { slug: 'test', title: 'Test', tags: '' };
    const graph = buildArticleGraph(article);
    const node = graph.find(n => n['@type'] === 'NewsArticle');
    expect(node.keywords).toBeUndefined();
  });

  it('omits keywords when tags is empty JSON array', () => {
    const article = { slug: 'test', title: 'Test', tags: '[]' };
    const graph = buildArticleGraph(article);
    const node = graph.find(n => n['@type'] === 'NewsArticle');
    expect(node.keywords).toBeUndefined();
  });
});

// ─── Homepage and Archive graph smoke tests ───────────────────────────────────

describe('buildHomepageGraph', () => {
  it('contains WebSite, NewsMediaOrganization, BreadcrumbList', () => {
    const graph = buildHomepageGraph();
    const types = graph.map(n => n['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('NewsMediaOrganization');
    expect(types).toContain('BreadcrumbList');
  });

  it('WebSite node has potentialAction SearchAction', () => {
    const graph = buildHomepageGraph();
    const ws = graph.find(n => n['@type'] === 'WebSite');
    expect(ws.potentialAction['@type']).toBe('SearchAction');
  });
});

describe('buildArchiveGraph', () => {
  it('contains CollectionPage, NewsMediaOrganization, BreadcrumbList', () => {
    const graph = buildArchiveGraph();
    const types = graph.map(n => n['@type']);
    expect(types).toContain('CollectionPage');
    expect(types).toContain('NewsMediaOrganization');
    expect(types).toContain('BreadcrumbList');
  });
});
