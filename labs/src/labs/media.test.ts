import { describe, expect, it } from 'vitest';

import { mediaType, parseRange } from './media';

describe('mediaType', () => {
  it('serves plain file names of known types', () => {
    expect(mediaType('cv-screen.mp4')).toBe('video/mp4');
    expect(mediaType('cv-screen.webm')).toBe('video/webm');
    expect(mediaType('cv-screen-poster.jpg')).toBe('image/jpeg');
  });

  it('refuses paths, dot-segments, hidden files and unknown types', () => {
    for (const bad of ['../data.json', 'a/b.mp4', '..mp4', '.env', 'data.json', 'x.MP4', 'x.mp4.exe', '']) {
      expect(mediaType(bad), bad).toBeUndefined();
    }
  });
});

describe('parseRange', () => {
  it('sends the whole file when there is no single byte range', () => {
    expect(parseRange(null, 1000)).toBeUndefined();
    expect(parseRange('bytes=0-10,20-30', 1000)).toBeUndefined();
    expect(parseRange('items=0-10', 1000)).toBeUndefined();
    expect(parseRange('bytes=-', 1000)).toBeUndefined();
  });

  it('reads open, closed and suffix ranges, clamped to the file', () => {
    expect(parseRange('bytes=0-1', 1000)).toEqual({ start: 0, end: 1 });
    expect(parseRange('bytes=200-', 1000)).toEqual({ start: 200, end: 999 });
    expect(parseRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 });
  });

  it('refuses a range that starts past the end', () => {
    expect(parseRange('bytes=1000-', 1000)).toBe('unsatisfiable');
    expect(parseRange('bytes=10-5', 1000)).toBe('unsatisfiable');
    expect(parseRange('bytes=-0', 1000)).toBe('unsatisfiable');
  });
});
