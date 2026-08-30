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
    heading: 'The Main Page’s Own "Kubernetes Security Context" Sample Never Actually Pinned a Digest',
    points: [
      'The main page’s own third mistake block gets this exactly right: <code>image: gcr.io/myproject/myapp@sha256:abc123...</code> — an <code>@sha256:&lt;hex&gt;</code> DIGEST reference, immutable, pointing at one specific image content hash forever.',
      'The Kubernetes Security Context codeTab used <code>image: gcr.io/myproject/api:sha256-abc123</code> instead — a colon (<code>:</code>), not an at-sign (<code>@</code>), and <code>sha256-abc123</code> as the value. Docker/OCI image references only recognize two forms: <code>name:tag</code> or <code>name@digest</code>. A string after a colon is ALWAYS parsed as a tag, no matter what characters it contains.',
      'That means <code>:sha256-abc123</code> was never a digest pin at all — it was just a TAG literally named "sha256-abc123", exactly as mutable and re-pushable as <code>:latest</code> or <code>:v1</code>. The comment claiming "pinned digest, not tag" was describing the OPPOSITE of what the syntax actually does.',
      'This has now been fixed on the main page to the real digest form (<code>@sha256:...</code>), matching the mistake block’s own correct example — this subtopic traces exactly why the original syntax failed to pin anything.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Telling Tag References from Digest References Apart',
    language: 'typescript',
    code: `// A minimal, dependency-free parser distinguishing the two valid
// forms of an OCI/Docker image reference's own version suffix.
interface ParsedImageRef {
  repository: string;
  kind: 'tag' | 'digest' | 'implicit-latest-tag';
  value: string;
  isImmutable: boolean; // true only for a real digest pin
}

function parseImageRef(ref: string): ParsedImageRef {
  // A digest reference always uses '@' -- and the digest itself is
  // "<algorithm>:<hex>", e.g. "sha256:e3b0c4429...". The '@' is what
  // separates repository from digest; a colon INSIDE the digest part
  // is just the algorithm/hex separator, not a tag delimiter.
  const atIndex = ref.indexOf('@');
  if (atIndex !== -1) {
    return {
      repository: ref.slice(0, atIndex),
      kind: 'digest',
      value: ref.slice(atIndex + 1),
      isImmutable: true,
    };
  }

  // No '@' -- everything after the LAST colon (that isn't part of a
  // registry port, e.g. "localhost:5000/app") is a tag. Real image
  // reference parsers handle the registry-port edge case; this
  // simplified version assumes no port for clarity.
  const colonIndex = ref.lastIndexOf(':');
  if (colonIndex !== -1) {
    return {
      repository: ref.slice(0, colonIndex),
      kind: 'tag',
      value: ref.slice(colonIndex + 1),
      isImmutable: false, // a tag is ALWAYS mutable, regardless of its name
    };
  }

  return { repository: ref, kind: 'implicit-latest-tag', value: 'latest', isImmutable: false };
}

console.log(parseImageRef('gcr.io/myproject/api@sha256:abc123def456...'));
// { repository: 'gcr.io/myproject/api', kind: 'digest', value: 'sha256:abc123def456...', isImmutable: true }

console.log(parseImageRef('gcr.io/myproject/api:sha256-abc123')); // the original codeTab's own string
// { repository: 'gcr.io/myproject/api', kind: 'tag', value: 'sha256-abc123', isImmutable: false }
// -- isImmutable: false. A registry admin (or an attacker with push
// access) can re-push a completely different image under this exact
// SAME tag name at any time, and every pod referencing it silently
// starts running the new content on its next pull.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate argues the original <code>image: gcr.io/myproject/api:sha256-abc123</code> line was "basically fine" because <code>sha256-abc123</code> LOOKS like a real digest and no one would deliberately re-push that exact tag name. What is the actual, concrete risk they are missing?',
  hint: 'Run <code>parseImageRef</code> on that exact string — what does <code>isImmutable</code> come back as, and what does that field control?',
  solution: `// The risk isn't "someone deliberately re-pushes THAT tag on
// purpose" -- it's that NOTHING in Docker's own reference format
// stops it from happening, deliberately or accidentally.

// A tag is just a mutable pointer the registry maintains, no matter
// what string is chosen for it. "sha256-abc123" carries zero special
// meaning to the registry -- it enforces no uniqueness, no
// content-matching, nothing. A CI pipeline bug that re-tags the
// wrong build artifact, a compromised registry credential pushing a
// malicious image under a plausible-looking tag, or even a simple
// copy-paste mistake in a Dockerfile -- any of these can silently
// swap what "gcr.io/myproject/api:sha256-abc123" resolves to.

// A REAL digest pin (@sha256:<hex>) has none of this risk, because
// the hex string IS a cryptographic hash of the image's own content
// -- Docker verifies it on pull. If the registry ever served
// different bytes under that exact digest, the pull would fail
// outright rather than silently succeed with different content.

// The teammate's mistake is treating a NAMING CONVENTION (a tag that
// happens to look digest-shaped) as if it provided the same
// cryptographic guarantee as an actual digest reference -- it
// doesn't provide any guarantee at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Any image reference containing the string "sha256" is a pinned digest.',
    reality: 'Only a reference using <code>@sha256:&lt;hex&gt;</code> (an at-sign, not a colon) is a real digest pin. <code>image:sha256-abc123</code> is a plain tag — the parser above shows Docker itself treats anything after a colon as a mutable tag, regardless of what the tag name looks like.',
  },
  {
    thought: 'Pinning by digest is only useful for reproducible builds — it has no security benefit.',
    reality: 'It has a direct security benefit too: a digest pin means the exact bytes that get pulled and run are cryptographically verified against the hash in the reference. A tag — even one with a misleading name — gives an attacker with registry push access (or a compromised CI credential) a way to swap what image content runs in production, with zero indication anything changed.',
  },
  {
    thought: 'Once an image is built and pushed, its tag and its digest always point to the same content forever.',
    reality: 'A tag can be re-pushed to point at completely different content at any time — that mutability is the entire distinction between a tag and a digest. A digest, by definition, can only ever refer to the one specific set of bytes that hash to it; there is no "re-pushing" a digest to mean something else.',
  },
];

@Component({
  selector: 'app-sec-container-digest-pin',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sha256-tag-vs-true-image-digest-pin.html',
  styleUrl: './sha256-tag-vs-true-image-digest-pin.scss',
})
export class Sha256TagVsTrueImageDigestPinSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
