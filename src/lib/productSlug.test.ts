import { describe, expect, it } from 'vitest';
import {
  generateProductUrl,
  generateProductUrlWithVolume,
  isLegacyProductUrl,
  parseProductUrl,
} from './productSlug';

describe('product URLs', () => {
  it('generates canonical city product and variant paths', () => {
    const product = { cityName: 'Bangalore', productSlug: 'old-monk-abc1234' };
    expect(generateProductUrl(product)).toBe('/bangalore/product/old-monk-abc1234');
    expect(generateProductUrlWithVolume(product, '750 ml')).toBe('/bangalore/product/old-monk-abc1234/750ml');
  });

  it('parses canonical city variant paths', () => {
    expect(parseProductUrl('/delhi/product/old-monk-abc1234/180ml')).toEqual({
      city: 'delhi',
      state: null,
      category: null,
      subCategory: null,
      productSlug: 'old-monk-abc1234',
      volume: '180ml',
    });
  });

  it('still recognizes state-based legacy paths', () => {
    const path = '/haryana/rum/dark-rum/old-monk-abc1234';
    expect(isLegacyProductUrl(path)).toBe(true);
    expect(parseProductUrl(path).productSlug).toBe('old-monk-abc1234');
  });
});
