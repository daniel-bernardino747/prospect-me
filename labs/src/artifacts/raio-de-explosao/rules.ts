import semver from 'semver';

/**
 * The semver side of the exposure rule, run once by `scripts/raio-de-explosao.ts`
 * and by the tests, never in the browser: the page reads the versions each
 * edge accepts from `data.json`, so `semver` stays out of the client bundle.
 */

/**
 * The malicious versions an edge's range lets in. A requirement npm cannot read
 * as a range (an alias, a URL, a git spec) accepts nothing.
 */
export function acceptedVersions(requirement: string, versions: readonly string[]): string[] {
  if (semver.validRange(requirement) === null) return [];
  return versions.filter((v) => semver.satisfies(v, requirement));
}

export interface Published {
  version: string;
  publishedAt: string;
}

/**
 * What `npm install <name>` resolved at an instant: the highest stable version
 * already published. (It ignores a `latest` tag pointing lower; the script
 * checks the presets against this.)
 */
export function resolveAt(versions: readonly Published[], instant: string): string | null {
  const at = Date.parse(instant);
  const stable = versions
    .filter((v) => Date.parse(v.publishedAt) <= at && semver.valid(v.version) && !semver.prerelease(v.version))
    .map((v) => v.version);
  return semver.maxSatisfying(stable, '*');
}

/**
 * A clean version, already out when the malicious one was published, that the
 * range would have picked over it. The rule "a malicious version satisfies the
 * range" assumes none exists; the script refuses to write data where one does.
 */
export function shadowingVersion(
  requirement: string,
  malicious: Published,
  all: readonly Published[],
): string | null {
  const at = Date.parse(malicious.publishedAt);
  const better = all.filter(
    (v) =>
      v.version !== malicious.version &&
      Date.parse(v.publishedAt) <= at &&
      semver.valid(v.version) &&
      semver.satisfies(v.version, requirement) &&
      semver.gt(v.version, malicious.version),
  );
  return better[0]?.version ?? null;
}

/** "ecosystem,package,versions" with versions split by " | " (the Datadog IOC file). */
export function parseIocCsv(csv: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const line of csv.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const [ecosystem, name, versions] = line.split(',');
    if (ecosystem !== 'npm' || !name || !versions) continue;
    const list = versions.split('|').map((v) => v.trim()).filter(Boolean);
    out.set(name, [...(out.get(name) ?? []), ...list]);
  }
  return out;
}
