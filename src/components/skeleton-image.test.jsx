// Feature: seo-infrastructure, Property 14: SkeletonImage reserves layout space

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import SkeletonImage from './SkeletonImage';

/**
 * Property 14: SkeletonImage reserves layout space
 * Validates: Requirements 4.2
 *
 * For any rendered SkeletonImage component, the root element must have either
 * explicit width and height attributes or a CSS aspect-ratio property set,
 * so that the browser can reserve space before the image loads.
 */
describe('SkeletonImage — layout space reservation (Property 14)', () => {
  it('sets explicit width and height styles when both props are provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          src: fc.webUrl(),
          width: fc.nat({ max: 2000 }).filter(n => n > 0),
          height: fc.nat({ max: 2000 }).filter(n => n > 0),
        }),
        ({ src, width, height }) => {
          const { container } = render(
            <SkeletonImage src={src} alt="test" width={width} height={height} />
          );
          const wrapper = container.firstChild;
          expect(wrapper.style.width).toBe(`${width}px`);
          expect(wrapper.style.height).toBe(`${height}px`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sets aspect-ratio style when only aspectRatio prop is provided', () => {
    const ratios = ['16/9', '4/3', '1/1', '3/2', '21/9'];
    fc.assert(
      fc.property(
        fc.record({
          src: fc.webUrl(),
          aspectRatio: fc.constantFrom(...ratios),
        }),
        ({ src, aspectRatio }) => {
          const { container } = render(
            <SkeletonImage src={src} alt="test" aspectRatio={aspectRatio} />
          );
          const wrapper = container.firstChild;
          expect(wrapper.style.aspectRatio).toBe(aspectRatio);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not set dimension styles when no width/height/aspectRatio are provided', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (src) => {
          const { container } = render(
            <SkeletonImage src={src} alt="test" />
          );
          const wrapper = container.firstChild;
          expect(wrapper.style.width).toBe('');
          expect(wrapper.style.height).toBe('');
          expect(wrapper.style.aspectRatio).toBe('');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('prefers width/height over aspectRatio when both are provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          src: fc.webUrl(),
          width: fc.nat({ max: 2000 }).filter(n => n > 0),
          height: fc.nat({ max: 2000 }).filter(n => n > 0),
        }),
        ({ src, width, height }) => {
          const { container } = render(
            <SkeletonImage src={src} alt="test" width={width} height={height} aspectRatio="16/9" />
          );
          const wrapper = container.firstChild;
          expect(wrapper.style.width).toBe(`${width}px`);
          expect(wrapper.style.height).toBe(`${height}px`);
          // aspectRatio should not be set when width+height are provided
          expect(wrapper.style.aspectRatio).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});
