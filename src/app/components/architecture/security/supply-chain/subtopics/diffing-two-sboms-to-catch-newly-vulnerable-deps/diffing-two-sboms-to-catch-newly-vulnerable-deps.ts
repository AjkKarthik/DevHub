import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Main Page’s Own Theory States the Gap — Never Closes It in Code',
    points: [
      'The main page’s own "Software Bill of Materials" section states the exact limitation plainly: "a static SBOM generated once at release time becomes stale as new CVEs are discovered for already-shipped dependencies, so ongoing monitoring against the SBOM is what provides lasting value" — but every codeTab on the page only ever GENERATES an SBOM once, at build time. Nothing re-checks it later.',
      'An SBOM by itself is just a component inventory — a list of names, versions, and purls (package URLs). It carries no vulnerability data of its own. "Monitoring against the SBOM" means periodically re-checking that SAME recorded component list against a vulnerability feed that keeps updating, independent of whether the software itself has changed at all.',
      'This is exactly what distinguishes an SBOM from a one-time <code>npm audit</code> run: <code>npm audit</code> answers "is this safe right now, given today’s advisory database" — a re-scanned SBOM answers "is this SAME artifact, shipped months ago, safe RIGHT NOW, given today’s advisory database" without needing the original build environment at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two SBOM Snapshots of the Same Artifact',
    language: 'typescript',
    code: `// A simplified CycloneDX-shaped SBOM -- the same component list,
// captured at two different points in time. Nothing about the
// SHIPPED ARTIFACT changed between these two snapshots; only the
// vulnerability data available FOR that artifact's components did.

interface SbomComponent {
  name: string;
  version: string;
  purl: string; // package URL, e.g. "pkg:npm/lodash@4.17.15"
}

interface Sbom {
  bomFormat: 'CycloneDX';
  specVersion: '1.5';
  metadata: { timestamp: string };
  components: SbomComponent[];
}

const sbomAtReleaseTime: Sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  metadata: { timestamp: '2026-01-15T00:00:00Z' },
  components: [
    { name: 'express',    version: '4.18.2', purl: 'pkg:npm/express@4.18.2' },
    { name: 'lodash',     version: '4.17.21', purl: 'pkg:npm/lodash@4.17.21' },
    { name: 'jsonwebtoken', version: '9.0.0', purl: 'pkg:npm/jsonwebtoken@9.0.0' },
  ],
};

// The component list is IDENTICAL months later -- the artifact was
// never rebuilt, never redeployed, never touched. Only the outside
// world (the vulnerability database) changed in the meantime.
const sbomReScannedLater: Sbom = { ...sbomAtReleaseTime, metadata: { timestamp: '2026-08-30T00:00:00Z' } };`,
  },
  {
    label: 'Re-Scanning the SAME SBOM Against a Live Vulnerability Feed',
    language: 'typescript',
    code: `interface VulnAdvisory { purl: string; cveId: string; severity: 'low' | 'moderate' | 'high' | 'critical'; publishedAfter: string; }

// A minimal stand-in for a real vulnerability feed (e.g. OSV.dev,
// GitHub Advisory Database) -- returns every KNOWN advisory for a
// purl, regardless of when it was published relative to the SBOM.
function lookupAdvisories(purl: string, feed: VulnAdvisory[]): VulnAdvisory[] {
  return feed.filter(a => a.purl === purl);
}

function rescanSbom(sbom: Sbom, feed: VulnAdvisory[]): { component: string; newSince: string; advisories: VulnAdvisory[] }[] {
  const findings: { component: string; newSince: string; advisories: VulnAdvisory[] }[] = [];
  for (const c of sbom.components) {
    const advisories = lookupAdvisories(c.purl, feed)
      // Only flag advisories published AFTER this SBOM's own
      // timestamp -- these are the ones a one-time scan at release
      // time could never have caught, since they didn't exist yet.
      .filter(a => a.publishedAfter > sbom.metadata.timestamp);
    if (advisories.length > 0) {
      findings.push({ component: \`\${c.name}@\${c.version}\`, newSince: sbom.metadata.timestamp, advisories });
    }
  }
  return findings;
}

// A CVE disclosed in jsonwebtoken AFTER the original release-time
// SBOM was generated -- exactly the "already-shipped dependency, new
// CVE discovered later" scenario the main page's own theory names.
const feed: VulnAdvisory[] = [
  { purl: 'pkg:npm/jsonwebtoken@9.0.0', cveId: 'CVE-2026-EXAMPLE', severity: 'high', publishedAfter: '2026-03-01T00:00:00Z' },
];

console.log(rescanSbom(sbomAtReleaseTime, feed));
// [{ component: 'jsonwebtoken@9.0.0', newSince: '2026-01-15T00:00:00Z',
//    advisories: [{ purl: '...', cveId: 'CVE-2026-EXAMPLE', severity: 'high', publishedAfter: '2026-03-01T00:00:00Z' }] }]
// -- flagged even though NOTHING about the artifact itself changed.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes skipping <code>rescanSbom</code> entirely for a service that hasn’t been redeployed in 8 months, reasoning "nothing changed, so there’s nothing new to find." What specifically makes this reasoning wrong for an SBOM-based scan, in a way it wouldn’t be for re-running the test suite?',
  hint: 'What does <code>rescanSbom</code>’s own <code>publishedAfter</code> filter compare against — the artifact’s last build date, or something else entirely?',
  solution: `// The reasoning conflates "the ARTIFACT hasn't changed" with
// "there's nothing new to discover about it" -- but rescanSbom's own
// filter compares each advisory's publishedAfter date against the
// SBOM's timestamp, not against whether the artifact was rebuilt.

// The artifact's component versions being frozen is exactly WHY a
// re-scan is still valuable: the jsonwebtoken@9.0.0 in the example
// is the SAME version today as it was 8 months ago -- but a CVE
// against that specific version can be (and, in the example, was)
// disclosed at ANY point after release, entirely independent of
// whether the consuming service rebuilds, redeploys, or changes
// anything at all.

// Re-running the test suite genuinely finds nothing new for
// unchanged code, because the test suite only checks properties of
// the code ITSELF. A vulnerability re-scan checks the code's
// components against an EXTERNAL, continuously-updated database --
// new information can appear about old, completely unchanged code at
// any time, which is precisely the "static SBOM becomes stale" gap
// the main page's own theory names.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'An SBOM itself contains vulnerability information — generating one is a vulnerability scan.',
    reality: 'An SBOM is purely a component INVENTORY — names, versions, purls (package URLs), licenses. It contains zero vulnerability data on its own. Turning it into a security signal requires a SEPARATE step: checking each listed component’s purl against a vulnerability feed, either once at generation time or repeatedly over the artifact’s lifetime (as <code>rescanSbom</code> does).',
  },
  {
    thought: 'Re-scanning an SBOM is only worth doing right after a new CVE is publicly announced for something you think you might use.',
    reality: 'The whole value of SBOM-based monitoring is that it works the OTHER direction — you don’t need to already suspect a specific component is affected. A scheduled re-scan (e.g. nightly, or triggered by new advisory-database entries) automatically surfaces any newly-disclosed CVE against ANY component in the recorded inventory, without a human having to first notice and go looking.',
  },
  {
    thought: 'Comparing two SBOM snapshots is mainly useful for seeing which dependencies were ADDED or REMOVED between releases.',
    reality: 'That is one real use — but the codeTab above demonstrates a DIFFERENT one: re-scanning the SAME, unchanged component list against a LATER vulnerability feed, to catch CVEs disclosed after the SBOM was generated. Both are valid SBOM-diffing use cases, but they answer different questions — "what changed in the artifact" versus "what changed in the outside world’s knowledge about the artifact."',
  },
];

@Component({
  selector: 'app-sec-supply-chain-sbom-rescan',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './diffing-two-sboms-to-catch-newly-vulnerable-deps.html',
  styleUrl: './diffing-two-sboms-to-catch-newly-vulnerable-deps.scss',
})
export class DiffingTwoSbomsToCatchNewlyVulnerableDepsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
