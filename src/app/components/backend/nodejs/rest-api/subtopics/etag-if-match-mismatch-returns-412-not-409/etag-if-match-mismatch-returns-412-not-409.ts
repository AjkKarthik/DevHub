import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './etag-if-match-mismatch-returns-412-not-409.html',
  styleUrl: './etag-if-match-mismatch-returns-412-not-409.scss'
})
export class EtagIfMatchMismatchReturns412Not409Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s quiz explains WHAT an ETag is for (caching + optimistic locking) — this subtopic pins down the exact status code and comparison rule a server must follow, since both are easy to get wrong',
      points: [
        'Per RFC 9110 (HTTP Semantics) section 13.1.1, when a client sends a write request (PUT or PATCH) with an If-Match header, and the server\'s CURRENT ETag for that resource does not match any of the ETags listed in If-Match, the server MUST respond with 412 Precondition Failed. A common instinct is to reach for 409 Conflict instead — that is the wrong status code for this specific situation. 409 is for a general resource-state conflict the server detects on its own; 412 is specifically for "a precondition YOU sent in a header failed."',
        'ETags come in two flavors: a strong ETag (no prefix, e.g. "abc123") asserts byte-for-byte identical representation. A weak ETag (W/"abc123" prefix) only asserts semantic equivalence — two responses could have the same weak ETag while differing in some byte that doesn\'t matter (like whitespace formatting).',
        'RFC 9110 section 8.8.3.2 defines the "strong comparison" function required for If-Match matching as requiring BOTH ETags to be non-weak. This has a precise, easy-to-miss consequence: a weak ETag can never satisfy an If-Match precondition, even when compared against an ETag with the identical opaque value — the W/ prefix alone disqualifies it from strong comparison. So a resource using only weak ETags effectively cannot support If-Match-based optimistic locking at all (except the special case If-Match: *, which only checks that the resource exists).',
      ]
    },
    {
      heading: 'Why this distinction matters for a real Express/Fastify handler',
      points: [
        'If-None-Match (used for caching, not locking) uses the WEAK comparison function per section 13.1.2 — weak ETags work fine there, since a semantically-equivalent-but-not-byte-identical response is still a valid cache hit. This is the opposite comparison rule from If-Match, so the two headers are not just "the inverse of each other" — they use genuinely different equality rules.',
        'A handler generating ETags by hashing the full JSON response body must do so deterministically — if the same underlying data can serialize to two different byte sequences (e.g. object key order varies between two DB driver versions, or a timestamp field has sub-second jitter), the ETag will differ even though nothing meaningful changed, causing spurious 412s on writes that should have succeeded.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Correct: 412 on mismatch, strong ETag required for If-Match',
      language: 'typescript',
      code: `import { createHash } from 'node:crypto';

function strongEtagFor(resource) {
  // Deterministic serialization: sort keys so field order never
  // causes a spurious hash difference for identical data.
  const canonical = JSON.stringify(resource, Object.keys(resource).sort());
  const hash = createHash('sha256').update(canonical).digest('hex').slice(0, 16);
  return \`"\${hash}"\`; // no W/ prefix => strong ETag, usable with If-Match
}

router.put('/documents/:id', async (req, res) => {
  const current = await docsRepo.findById(req.params.id);
  const clientEtag = req.get('If-Match');

  if (clientEtag) {
    const currentEtag = strongEtagFor(current);
    if (clientEtag !== currentEtag) {
      // RFC 9110 13.1.1: 412, NOT 409, on If-Match mismatch.
      return res.status(412).json({
        error: 'Precondition Failed',
        detail: 'Resource was modified since you last fetched it',
      });
    }
  }

  const updated = await docsRepo.update(req.params.id, req.body);
  res.set('ETag', strongEtagFor(updated));
  res.json(updated);
});`,
    },
    {
      label: 'Weak ETags cannot satisfy If-Match, even with identical values',
      language: 'typescript',
      code: `// A weak ETag (W/ prefix) asserts only semantic equivalence.
// It is correctly usable for If-None-Match (caching):
router.get('/documents/:id', async (req, res) => {
  const doc = await docsRepo.findById(req.params.id);
  const weakEtag = \`W/"\${doc.version}"\`;
  res.set('ETag', weakEtag);

  if (req.get('If-None-Match') === weakEtag) {
    return res.status(304).end(); // weak comparison: this is fine
  }
  res.json(doc);
});

// But the SAME weak ETag can never satisfy If-Match's strong
// comparison rule, per RFC 9110 8.8.3.2 — "both are not weak" is
// required. This If-Match check below will ALWAYS fail (return 412)
// even if the value is byte-identical, because it's weak:
router.put('/documents/:id', async (req, res) => {
  const doc = await docsRepo.findById(req.params.id);
  const weakEtag = \`W/"\${doc.version}"\`; // wrong choice for If-Match use

  if (req.get('If-Match') === weakEtag) {
    // This branch is effectively unreachable in a spec-compliant
    // client, since a compliant client won't send a weak ETag back
    // in If-Match expecting it to match — strong comparison always
    // treats any weak tag as a non-match.
  }
  // Fix: generate and compare a STRONG ETag for any resource that
  // needs If-Match-based optimistic locking, as in the first tab.
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A code reviewer sees a PUT handler that returns 409 Conflict when a client\'s If-Match header doesn\'t match the resource\'s current ETag, with a comment saying "409 because the update conflicts with the current state." Is this the correct status code per RFC 9110? If not, what should it be, and what is the precise distinction between the two status codes here?',
    hint: 'Is 409 a general "the server detected some conflict in resource state" code, or is it specifically for "a precondition header you sent didn\'t match"? What does RFC 9110 section 13.1.1 say applies specifically to If-Match mismatches?',
    solution: 'This is incorrect — RFC 9110 section 13.1.1 specifically requires 412 Precondition Failed when an If-Match header\'s value does not match the resource\'s current ETag, not 409 Conflict. The precise distinction: 412 is reserved for cases where a precondition the CLIENT explicitly stated in a request header (If-Match, If-None-Match, If-Unmodified-Since, etc.) evaluates to false — the server is saying "you asked me to only proceed if X was true, and X was not true." 409 Conflict is a broader, more general status meaning the server itself detected that the request conflicts with the current state of the resource in some way not tied to a specific precondition header — for example, trying to create a resource that already exists with a unique constraint violation. Since this handler\'s failure is specifically about an If-Match header not matching, 412 is the RFC-correct status code, and the reviewer should flag the comment and status code for correction.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a PUT request\'s If-Match header doesn\'t match the resource\'s current ETag, the server should return 409 Conflict, since the update conflicts with the resource\'s current state.',
      reality: 'This subtopic\'s theory and exercise both establish that RFC 9110 section 13.1.1 specifically mandates 412 Precondition Failed for this exact situation — 409 is reserved for conflicts the server detects on its own, not for a client-stated precondition header failing to match.'
    },
    {
      thought: 'A weak ETag (with the W/ prefix) and a strong ETag with the identical opaque value are interchangeable for If-Match precondition checks, since the underlying value is the same.',
      reality: 'This subtopic\'s code example shows RFC 9110\'s strong comparison function (required for If-Match) explicitly requires BOTH tags to be non-weak — a weak ETag can never satisfy an If-Match precondition, regardless of whether its value matches, making weak and strong ETags NOT interchangeable for this purpose.'
    },
    {
      thought: 'If-Match and If-None-Match are simply inverses of the same comparison — one checks for a match, the other checks for no match, using the same equality rule.',
      reality: 'This subtopic\'s theory clarifies they use genuinely DIFFERENT comparison functions per the RFC: If-Match requires strong comparison (both ETags non-weak), while If-None-Match uses weak comparison — so the two headers are not symmetric in how they treat weak ETags, not just in what outcome they check for.'
    }
  ];
}
