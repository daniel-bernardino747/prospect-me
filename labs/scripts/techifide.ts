/**
 * Gathers the public data behind /techifide once, and writes what the page
 * reads. Run by hand, never on a schedule (ADR-0001: public data gathered once,
 * no recurring crawler).
 *
 *   node --no-warnings labs/scripts/techifide.ts capture   # sources/*.json
 *   node --no-warnings labs/scripts/techifide.ts build     # data.json, offline
 *
 * The extraction (`extraction/<ad>.json`, shaped as `Extraction` in
 * review.ts) was written once by Claude in a Claude Code session, not by an
 * API call: the page never calls a model, so a visitor costs nothing. `build`
 * is the review pass: code keeps only what is literally in the ad.
 *
 * robots.txt, checked 2026-09-28: www.techifide.com disallows only /wp-admin/
 * and one plugin file; techifide.careers-page.com serves no robots.txt (the
 * path answers with the careers app). Each page is fetched once.
 *
 * Sources:
 * - The three Manatal ads on techifide.careers-page.com: title, JSON-LD dates,
 *   and the body. The ads name no person; `capture` refuses one that does.
 * - www.techifide.com: the eleven Role Fit dimensions, the Role Fit Profile
 *   paragraph, the "advanced matching algorithm" line, and the field list of
 *   the Techi-job-offer.docx template (read from its `word/document.xml`).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

import {
  AD_KEYS,
  type AdKey,
  type AdSource,
  type AdView,
  type Listing,
  type QuoteSource,
  type RoleFitSource,
  type TechifideData,
  type TemplateSource,
} from '../src/artifacts/techifide/data.ts';
import { type Extraction, review } from '../src/artifacts/techifide/review.ts';
import {
  decodeEntities,
  dimensionLine,
  docxParagraphs,
  htmlToLines,
  jobPosting,
  pageLines,
} from '../src/artifacts/techifide/source.ts';

const ARTIFACT = new URL('../src/artifacts/techifide/', import.meta.url);
const SOURCES = fileURLToPath(new URL('sources/', ARTIFACT));
const EXTRACTION = fileURLToPath(new URL('extraction/', ARTIFACT));
const OUT = fileURLToPath(new URL('data.json', ARTIFACT));
const SITE = 'https://www.techifide.com';
const ADS: Record<AdKey, string> = {
  fullstack: 'https://techifide.careers-page.com/jobs/7ea41dbd-d010-46a9-9d55-bce9d3923a4c',
  ml: 'https://techifide.careers-page.com/jobs/7b85ad5a-4522-46c6-b139-e93c7c2893e3',
  qa: 'https://techifide.careers-page.com/jobs/45222237-56e9-4cca-bb77-aa70f623c0b9',
};
const TEMPLATE = `${SITE}/wp-content/uploads/2023/07/Techi-job-offer.docx`;
const HEADERS = { 'user-agent': 'Mozilla/5.0 (labs.teamdbsolutions.com; one-off capture)' };

async function fetchOk(url: string): Promise<Response> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
}

const text = async (url: string) => (await fetchOk(url)).text();

function write(name: string, value: unknown) {
  mkdirSync(SOURCES, { recursive: true });
  writeFileSync(`${SOURCES}${name}.json`, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`  → sources/${name}.json`);
}

/** One entry of a zip archive, read from its central directory. */
function unzipEntry(zip: Buffer, name: string): Buffer {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let at = zip.readUInt32LE(eocd + 16);
  const count = zip.readUInt16LE(eocd + 10);
  for (let i = 0; i < count; i++) {
    const method = zip.readUInt16LE(at + 10);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const extra = zip.readUInt16LE(at + 30);
    const comment = zip.readUInt16LE(at + 32);
    const local = zip.readUInt32LE(at + 42);
    if (zip.toString('utf8', at + 46, at + 46 + nameLength) === name) {
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const body = zip.subarray(start, start + size);
      return method === 0 ? body : inflateRawSync(body);
    }
    at += 46 + nameLength + extra + comment;
  }
  throw new Error(`${name} not in archive`);
}

interface JobPostingLd {
  jobLocation?: { address?: { addressLocality?: string; addressCountry?: string } };
  jobLocationType?: string;
  applicantLocationRequirements?: { name?: string };
  employmentType?: string;
}

function listing(posting: Record<string, unknown>): Listing {
  const ld = posting as JobPostingLd;
  const address = ld.jobLocation?.address;
  const location = [address?.addressLocality, address?.addressCountry].filter(Boolean).join(', ');
  return {
    location: location || null,
    remote: ld.jobLocationType === 'TELECOMMUTE',
    applicantCountry: ld.applicantLocationRequirements?.name ?? null,
    employmentType: ld.employmentType ?? null,
  };
}

async function captureAd(key: AdKey, url: string): Promise<AdSource> {
  const posting = jobPosting(await text(url));
  if (!posting) throw new Error(`${url}: no JobPosting JSON-LD`);
  const lines = htmlToLines(String(posting.description ?? ''));
  // The ads name no person; if one ever does, it is removed by hand, not kept.
  const personal = lines.filter((l) => /@|linkedin\.com\/in\/|\+\d[\d\s]{7,}/i.test(l));
  if (personal.length) throw new Error(`${url}: lines that may identify a person:\n${personal.join('\n')}`);
  return {
    key,
    url,
    capturedAt: new Date().toISOString(),
    title: decodeEntities(String(posting.title)).trim(),
    datePosted: String(posting.datePosted),
    validThrough: posting.validThrough ? String(posting.validThrough) : null,
    listing: listing(posting),
    lines,
  };
}

async function capture() {
  console.log('Ads');
  for (const [key, url] of Object.entries(ADS) as [AdKey, string][]) {
    const ad = await captureAd(key, url);
    console.log(`  ${ad.title}: ${ad.lines.length} lines, posted ${ad.datePosted}`);
    write(`ad-${key}`, ad);
  }

  console.log('Role Fit Assessment');
  const roleFitUrl = `${SITE}/techifide-role-fit-assessment/`;
  const assessment = pageLines(await text(roleFitUrl), /^What We Measure$/, /^How We Use Your Results$/);
  const dimensions = assessment.map(dimensionLine).filter((d) => d !== undefined);
  if (dimensions.length !== 11) throw new Error(`${roleFitUrl}: expected 11 dimensions, found ${dimensions.length}`);
  write('role-fit', { url: roleFitUrl, capturedAt: new Date().toISOString(), dimensions } satisfies RoleFitSource);

  console.log('Screening and evaluation');
  const screeningUrl = `${SITE}/screening-and-evaluation/`;
  const profile = pageLines(await text(screeningUrl), /^Role Fit Assessment$/, /^Behavioral Interviews$/).find((l) =>
    l.includes('Role Fit Profile'),
  );
  if (!profile) throw new Error(`${screeningUrl}: no Role Fit Profile paragraph`);
  write('screening', { url: screeningUrl, capturedAt: new Date().toISOString(), quote: profile } satisfies QuoteSource);

  console.log('Submit vacancy');
  const vacancyUrl = `${SITE}/submit-vacancy/`;
  const promise = htmlToLines(await text(vacancyUrl))
    .flatMap((l) => l.split(/(?<=\.) /))
    .find((s) => s.includes('advanced matching algorithm'));
  if (!promise) throw new Error(`${vacancyUrl}: no "advanced matching algorithm" line`);
  write('submit-vacancy', { url: vacancyUrl, capturedAt: new Date().toISOString(), quote: promise } satisfies QuoteSource);

  console.log('Techi-job-offer.docx');
  const docx = Buffer.from(await (await fetchOk(TEMPLATE)).arrayBuffer());
  // The first paragraph is the instruction to e-mail the form back, not a field.
  const fields = docxParagraphs(unzipEntry(docx, 'word/document.xml').toString('utf8')).filter(
    (p) => !/^Please complete/i.test(p),
  );
  write('template', { url: TEMPLATE, capturedAt: new Date().toISOString(), fields } satisfies TemplateSource);
}

const read = <T,>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;
const source = <T,>(name: string) => read<T>(`${SOURCES}${name}.json`);

function build() {
  const roleFit = source<RoleFitSource>('role-fit');
  const template = source<TemplateSource>('template');
  const ads = {} as Record<AdKey, AdView>;
  const models = new Set<string>();
  for (const key of AD_KEYS) {
    const ad = source<AdSource>(`ad-${key}`);
    const { model, extraction } = read<{ model: string; extraction: Extraction }>(`${EXTRACTION}${key}.json`);
    models.add(model);
    // The title is part of the ad as published, so it may be quoted too: lane 0.
    const lanes = [ad.title, ...ad.lines];
    const reviewed = review(extraction, { lines: lanes }, template.fields, roleFit.dimensions);
    const { lines: _lines, validThrough: _valid, ...meta } = ad;
    ads[key] = { ...meta, lanes, ...reviewed };
    const scored = reviewed.dimensions.filter((d) => 'score' in d).length;
    console.log(`  ${key}: ${11 - scored} questions, ${scored} scored, ${reviewed.contradictions.length} contradictions, ${reviewed.dropped} quotes dropped`);
  }
  const data: TechifideData = {
    generatedAt: new Date().toISOString(),
    model: [...models].join(', '),
    dimensions: roleFit.dimensions,
    sources: {
      roleFit: { url: roleFit.url, capturedAt: roleFit.capturedAt },
      screening: source<QuoteSource>('screening'),
      submitVacancy: source<QuoteSource>('submit-vacancy'),
      template,
    },
    ads,
  };
  writeFileSync(OUT, `${JSON.stringify(data, null, 2)}
`);
  console.log(`  → data.json`);
}

const [command] = process.argv.slice(2);
if (command === 'capture') await capture();
else if (command === 'build') build();
else {
  console.error('usage: node --no-warnings labs/scripts/techifide.ts capture | build');
  process.exitCode = 1;
}
