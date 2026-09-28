import { describe, expect, it } from 'vitest';

import { decodeEntities, dimensionLine, docxParagraphs, htmlToLines, jobPosting } from './source';

describe('htmlToLines', () => {
  it('gives one line per paragraph, heading and list item, with inline markup dropped', () => {
    const html =
      "<p><span>We're looking for a </span><b><strong>Senior</strong></b><span> engineer.</span></p>" +
      '<h2><b>Nice to have</b></h2><ul><li><span>WebGL,   WebGPU or Three.js.</span></li><li>AWS&nbsp;infra &amp; ops</li></ul>';
    expect(htmlToLines(html)).toEqual([
      "We're looking for a Senior engineer.",
      'Nice to have',
      'WebGL, WebGPU or Three.js.',
      'AWS infra & ops',
    ]);
  });
});

describe('decodeEntities', () => {
  it('decodes named and numeric entities and leaves unknown ones', () => {
    expect(decodeEntities('It&#8217;s &raquo; &#x2014; &bogus;')).toBe('It’s » — &bogus;');
  });
});

describe('docxParagraphs', () => {
  it('joins the runs of each paragraph and skips empty ones', () => {
    const xml =
      '<w:p><w:r><w:t>Key Responsibilities </w:t></w:r><w:r><w:t xml:space="preserve">&amp; Accountabilities</w:t></w:r></w:p>' +
      '<w:p></w:p><w:p><w:r><w:t>Salary</w:t></w:r></w:p>';
    expect(docxParagraphs(xml)).toEqual(['Key Responsibilities & Accountabilities', 'Salary']);
  });
});

describe('jobPosting', () => {
  it('finds the JobPosting among the JSON-LD blocks', () => {
    const html =
      '<script type="application/ld+json">{"@type":"Organization"}</script>' +
      '<script type="application/ld+json">{"@type":"JobPosting","title":"QA"}</script>';
    expect(jobPosting(html)?.title).toBe('QA');
    expect(jobPosting('<p>none</p>')).toBeUndefined();
  });
});

describe('dimensionLine', () => {
  it('splits a dimension name from its description at the dash', () => {
    expect(dimensionLine('Risk / Experimentation – How willing you are to explore new ideas.')).toEqual({
      name: 'Risk / Experimentation',
      description: 'How willing you are to explore new ideas.',
    });
    expect(dimensionLine('Execution Style – Whether you naturally prefer careful planning.')?.name).toBe('Execution Style');
    expect(dimensionLine('What We Measure')).toBeUndefined();
  });
});
